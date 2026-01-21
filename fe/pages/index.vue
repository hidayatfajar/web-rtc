<template>
  <div class="p-6 space-y-4">
    <h1 class="text-xl font-bold">
      WebRTC Screen Share
      <span v-if="joined"> ({{ participants.length }} users) </span>
    </h1>

    <div class="flex gap-2 items-center flex-wrap">
      <input
        v-model="roomId"
        class="border rounded px-3 py-2 w-64 disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder="Room ID (e.g. room-1)"
        :disabled="joined"
        :readonly="joined"
      />
      <button class="border rounded px-3 py-2" @click="joinRoom">
        {{ joined ? "Disconnect" : "Join Room" }}
      </button>

      <button
        v-if="joined"
        class="border rounded px-3 py-2"
        :class="cameraEnabled ? 'bg-blue-500 text-white' : 'bg-gray-300'"
        @click="toggleCamera"
      >
        📹 {{ cameraEnabled ? "Stop Camera" : "Start Camera" }}
      </button>

      <div v-if="joined" class="relative">
        <button
          class="border rounded px-3 py-2"
          :class="micEnabled ? 'bg-blue-500 text-white' : 'bg-gray-300'"
          @click="toggleMic"
        >
          🎤 {{ micEnabled ? "Mute" : "Unmute" }}
        </button>
        
        <!-- Mic Warning Tooltip -->
        <div
          v-if="showMicWarning"
          class="absolute bottom-full left-0 mb-2 w-64 bg-yellow-100 border-2 border-yellow-400 rounded-lg shadow-lg p-3 z-50 animate-pulse"
        >
          <div class="flex items-start gap-2">
            <span class="text-xl">⚠️</span>
            <div class="flex-1">
              <p class="text-sm font-semibold text-yellow-800 mb-1">Apakah Anda berbicara?</p>
              <p class="text-xs text-yellow-700">Mikrofon Anda tidak aktif. Aktifkan untuk berkomunikasi dengan peserta lain.</p>
            </div>
            <button 
              @click="showMicWarning = false"
              class="text-yellow-600 hover:text-yellow-800 text-lg leading-none"
            >&times;</button>
          </div>
        </div>
      </div>

      <button
        v-if="joined"
        class="border rounded px-3 py-2 disabled:opacity-50"
        @click="startShareScreen"
      >
        🖥️ {{ sharing ? "Stop Sharing" : "Share Screen" }}
      </button>

      <button
        v-if="joined && isHost"
        class="border rounded px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        :class="
          recording
            ? 'bg-red-500 text-white'
            : isHost
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-300 text-gray-500'
        "
        :disabled="!isHost || showUploadingModal"
        @click="recording ? confirmStopRecording() : startRecording()"
        :title="!isHost ? 'Hanya host yang bisa merekam' : ''"
      >
        {{
          recording
            ? `⏹ Hentikan (${formatDuration(recordingDuration)})`
            : "⏺ Rekam"
        }}
      </button>
    </div>

    <!-- Status Banners -->
    <div class="space-y-2">
      <!-- Recording Status Badge (for host) -->
      <div
        v-if="recording && isHost"
        class="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg"
      >
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span class="font-semibold text-red-700">REC</span>
          <span class="text-sm text-red-600">{{
            formatDuration(recordingDuration)
          }}</span>
        </div>
        <span class="text-sm text-gray-600 ml-2"
          >• Rekaman aktif •
          {{
            sharing || hasRemoteScreenShare
              ? "Screen + Participants"
              : "Participants Grid"
          }}</span
        >
      </div>

      <!-- Recording Status Badge (for non-host participants) -->
      <div
        v-if="recording && !isHost"
        class="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg"
      >
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span class="font-semibold text-red-700"
            >⏺ Host is recording this meeting</span
          >
        </div>
      </div>

      <!-- Screen Share Status (Your screen) -->
      <div
        v-if="sharing"
        class="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <div class="text-blue-600">🖥️</div>
        <span class="font-semibold text-blue-700"
          >You're now sharing your screen</span
        >
      </div>

      <!-- Screen Share Status (Remote user's screen) -->
      <div
        v-if="!sharing && hasRemoteScreenShare && whoIsSharing"
        class="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg"
      >
        <div class="text-purple-600">🖥️</div>
        <span class="font-semibold text-purple-700"
          >{{ whoIsSharing.substring(0, 8) }} is sharing their screen</span
        >
      </div>
    </div>

    <!-- Modals -->
    <!-- Stop Recording Confirmation Modal -->
    <div
      v-if="showStopRecordingModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-2">Hentikan rekaman?</h3>
        <p class="text-gray-600 mb-4">
          Rekaman akan diunggah otomatis setelah dihentikan.
        </p>
        <div class="flex gap-2 justify-end">
          <button
            class="px-4 py-2 border rounded hover:bg-gray-50"
            @click="showStopRecordingModal = false"
          >
            Lanjut Rekam
          </button>
          <button
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            @click="stopRecording"
          >
            Hentikan & Upload
          </button>
        </div>
      </div>
    </div>

    <!-- Uploading Modal -->
    <div
      v-if="showUploadingModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-2">Mengunggah rekaman…</h3>
        <p class="text-sm text-gray-600 mb-4">
          Jangan tutup tab sampai selesai.
        </p>
        <div class="mb-4">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>{{ uploadedFileName }}</span>
            <span>{{ uploadProgress }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-500 h-2 rounded-full transition-all"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
        </div>
        <div class="flex items-center justify-center">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
          ></div>
        </div>
      </div>
    </div>

    <!-- Upload Success Modal -->
    <div
      v-if="showUploadSuccessModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div class="text-center mb-4">
          <div class="text-5xl mb-2">✅</div>
          <h3 class="text-lg font-semibold mb-2">Rekaman berhasil diunggah</h3>
          <p class="text-gray-600">File tersimpan di server.</p>
        </div>
        <div class="bg-gray-50 rounded p-3 mb-4 text-sm">
          <div class="font-medium mb-1">{{ uploadedFileName }}</div>
          <div class="text-gray-600">{{ uploadedFileUrl }}</div>
        </div>
        <div class="flex gap-2 flex-col">
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            @click="copyRecordingLink"
          >
            Salin Link
          </button>
          <div class="flex gap-2">
            <button
              class="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              @click="closeUploadSuccessModal"
            >
              Tutup
            </button>
            <button
              class="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              @click="startAnotherRecording"
            >
              Rekam Lagi
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Error Modal -->
    <div
      v-if="showUploadErrorModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div class="text-center mb-4">
          <div class="text-5xl mb-2">❌</div>
          <h3 class="text-lg font-semibold mb-2">Upload gagal</h3>
          <p class="text-gray-600">
            Koneksi tidak stabil atau server bermasalah.
          </p>
        </div>
        <div
          class="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700"
        >
          {{ uploadError }}
        </div>
        <p class="text-xs text-gray-500 mb-4">
          Rekaman tetap tersedia di perangkat ini sampai kamu menutup tab.
        </p>
        <div class="flex gap-2 flex-col">
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            @click="retryUpload"
          >
            Coba Upload Lagi
          </button>
          <div class="flex gap-2">
            <button
              class="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              @click="downloadRecording"
            >
              Download .webm
            </button>
            <button
              class="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              @click="discardRecording"
            >
              Buang Rekaman
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Grid untuk semua participants - Always visible when joined -->
    <div v-if="joined" class="space-y-3">
      <h2 class="font-semibold text-lg">
        Participants ({{ participants.length }})
      </h2>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <!-- Local Video (Your Camera) -->
        <div
          class="relative border-2 rounded-lg overflow-hidden bg-gray-800 transition-all"
          :class="isSpeaking[socket?.id || ''] ? 'border-green-500 shadow-lg shadow-green-500/50' : 'border-blue-500'"
          style="aspect-ratio: 16/9"
        >
          <video
            v-show="cameraEnabled"
            ref="localVideo"
            autoplay
            playsinline
            muted
            class="w-full h-full object-cover"
          ></video>
          <!-- Placeholder when camera off -->
          <div
            v-if="!cameraEnabled"
            class="absolute inset-0 flex flex-col items-center justify-center text-white bg-linear-to-br from-gray-700 to-gray-900"
          >
            <div class="text-7xl mb-2">👤</div>
            <div class="text-sm text-gray-400">Camera Off</div>
          </div>
          
          <!-- Speaking Indicator (Wave Animation) -->
          <div
            v-if="isSpeaking[socket?.id || ''] && micEnabled"
            class="absolute top-2 right-2 flex gap-1 items-end h-6 z-10"
          >
            <div class="w-1 bg-green-400 rounded-full animate-wave-1" style="height: 30%"></div>
            <div class="w-1 bg-green-400 rounded-full animate-wave-2" style="height: 50%"></div>
            <div class="w-1 bg-green-400 rounded-full animate-wave-3" style="height: 80%"></div>
            <div class="w-1 bg-green-400 rounded-full animate-wave-2" style="height: 50%"></div>
            <div class="w-1 bg-green-400 rounded-full animate-wave-1" style="height: 30%"></div>
          </div>
          
          <div
            class="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm z-10"
          >
            You {{ cameraEnabled ? "📹" : "🚫" }} {{ micEnabled ? "🎤" : "🔇" }}
          </div>
        </div>

        <!-- Remote Participants -->
        <div
          v-for="participant in participants.filter(
            (p) => !p.includes('(You)'),
          )"
          :key="participant"
          class="relative border-2 rounded-lg overflow-hidden bg-gray-800 transition-all"
          :class="isSpeaking[participant.split(' ')[0]] ? 'border-green-500 shadow-lg shadow-green-500/50' : 'border-gray-300'"
          style="aspect-ratio: 16/9"
        >
          <video
            v-show="participantMediaStatus[participant.split(' ')[0]]?.camera"
            :id="`video-${participant.split(' ')[0]}`"
            autoplay
            playsinline
            class="w-full h-full object-cover"
          ></video>
          <!-- Placeholder when camera off or no video -->
          <div
            v-if="!participantMediaStatus[participant.split(' ')[0]]?.camera"
            class="absolute inset-0 flex flex-col items-center justify-center text-white bg-linear-to-br from-gray-700 to-gray-900"
          >
            <div class="text-7xl mb-2">👤</div>
            <div class="text-sm text-gray-400">Camera Off</div>
          </div>
          
          <!-- Speaking Indicator (Wave Animation) -->
          <div
            v-if="isSpeaking[participant.split(' ')[0]] && participantMediaStatus[participant.split(' ')[0]]?.mic"
            class="absolute top-2 right-2 flex gap-1 items-end h-6 z-10"
          >
            <div class="w-1 bg-green-400 rounded-full animate-wave-1" style="height: 30%"></div>
            <div class="w-1 bg-green-400 rounded-full animate-wave-2" style="height: 50%"></div>
            <div class="w-1 bg-green-400 rounded-full animate-wave-3" style="height: 80%"></div>
            <div class="w-1 bg-green-400 rounded-full animate-wave-2" style="height: 50%"></div>
            <div class="w-1 bg-green-400 rounded-full animate-wave-1" style="height: 30%"></div>
          </div>
          
          <div
            class="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm z-10"
          >
            {{ participant.split(" ")[0].substring(0, 8) }}
            {{
              participantMediaStatus[participant.split(" ")[0]]?.camera
                ? "📹"
                : "🚫"
            }}
            {{
              participantMediaStatus[participant.split(" ")[0]]?.mic
                ? "🎤"
                : "🔇"
            }}
          </div>
        </div>
      </div>
    </div>

    <!-- Screen Share Display -->
    <div v-if="joined && (sharing || hasRemoteScreenShare)" class="space-y-3">
      <h2 class="font-semibold text-lg">Screen Share</h2>

      <div class="grid grid-cols-12 gap-4">
        <!-- Main Screen Share Area -->
        <div class="col-span-9 space-y-2">
          <div
            class="relative border-2 rounded-lg overflow-hidden bg-black"
            style="aspect-ratio: 16/9"
          >
            <!-- Local Screen Share Preview -->
            <video
              v-show="sharing"
              ref="localScreenVideo"
              autoplay
              playsinline
              muted
              class="w-full h-full object-contain"
            ></video>
            <!-- Remote Screen Share -->
            <video
              v-show="!sharing && hasRemoteScreenShare"
              ref="remoteVideo"
              autoplay
              playsinline
              class="w-full h-full object-contain"
            ></video>
            <!-- Placeholder when no screen share -->
            <div
              v-if="!sharing && !hasRemoteScreenShare"
              class="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-br from-gray-800 to-gray-900"
            >
              <div class="text-6xl mb-3">🖥️</div>
              <div class="text-lg text-gray-400">
                Waiting for screen share...
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar with Participants & Info -->
        <div class="col-span-3 space-y-3">
          <!-- Info Panel -->
          <div class="border rounded-lg p-3 bg-gray-50">
            <h3 class="font-semibold mb-2 text-sm">Meeting Info</h3>
            <div class="text-xs space-y-1">
              <div>
                Room: <span class="font-mono">{{ roomId }}</span>
              </div>
              <div>Participants: {{ participants.length }}</div>
              <div v-if="sharing" class="text-green-600 font-semibold mt-2">
                📡 You are sharing
              </div>
              <div
                v-if="recording"
                class="text-red-600 font-semibold mt-1 animate-pulse"
              >
                ⏺ Recording...
              </div>
            </div>
          </div>

          <!-- Participant Thumbnails -->
          <!-- <div class="space-y-2">
            <h3 class="font-semibold text-sm">Participants</h3> -->
            <!-- Local Thumbnail -->
            <!-- <div
              class="relative border-2 border-blue-500 rounded overflow-hidden bg-gray-800"
              style="aspect-ratio: 16/9"
            >
              <video
                v-show="cameraEnabled"
                ref="localVideoThumb"
                autoplay
                playsinline
                muted
                class="w-full h-full object-cover"
              ></video>
              <div
                v-if="!cameraEnabled"
                class="absolute inset-0 flex items-center justify-center text-white bg-gradient-to-br from-gray-700 to-gray-900"
              >
                <div class="text-3xl">👤</div>
              </div>
              <div
                class="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white px-1.5 py-0.5 rounded text-xs z-10"
              >
                You {{ cameraEnabled ? "📹" : "🚫" }}
                {{ micEnabled ? "🎤" : "🔇" }}
              </div>
            </div> -->

            <!-- Remote Thumbnails -->
            <!-- <div
              v-for="participant in participants.filter(
                (p) => !p.includes('(You)'),
              )"
              :key="participant"
              class="relative border rounded overflow-hidden bg-gray-800"
              style="aspect-ratio: 16/9"
            >
              <video
                v-show="
                  participantMediaStatus[participant.split(' ')[0]]?.camera
                "
                :id="`thumb-${participant.split(' ')[0]}`"
                autoplay
                playsinline
                class="w-full h-full object-cover"
              ></video>
              <div
                v-if="
                  !participantMediaStatus[participant.split(' ')[0]]?.camera
                "
                class="absolute inset-0 flex items-center justify-center text-white bg-gradient-to-br from-gray-700 to-gray-900"
              >
                <div class="text-3xl">👤</div>
              </div>
              <div
                class="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white px-1.5 py-0.5 rounded text-xs z-10"
              >
                {{ participant.split(" ")[0].substring(0, 6) }}
                {{
                  participantMediaStatus[participant.split(" ")[0]]?.camera
                    ? "📹"
                    : "🚫"
                }}
                {{
                  participantMediaStatus[participant.split(" ")[0]]?.mic
                    ? "🎤"
                    : "🔇"
                }}
              </div>
            </div> -->
          <!-- </div> -->
        </div>
      </div>
    </div>

    <div class="text-sm border rounded p-3 bg-gray-50">
      <div class="font-semibold mb-2">Debug Log (Last 30 entries)</div>
      <pre class="whitespace-pre-wrap text-xs max-h-40 overflow-y-auto">{{
        debugLog.join("\n")
      }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { io, type Socket } from "socket.io-client";

// Get socket URL from runtime config
const config = useRuntimeConfig();
const socketUrl = (config.public.socketUrl as string) || 'http://localhost:3001';

const roomId = ref("room-1");
const joined = ref(false);
const sharing = ref(false);
const recording = ref(false);
const cameraEnabled = ref(false);
const micEnabled = ref(false);
const participants = ref<string[]>([]);
const isHost = ref(false);

// Recording modals and states
const showStopRecordingModal = ref(false);
const showUploadingModal = ref(false);
const showUploadSuccessModal = ref(false);
const showUploadErrorModal = ref(false);
const uploadProgress = ref(0);
const uploadedFileUrl = ref("");
const uploadedFileName = ref("");
const uploadError = ref("");
const recordingDuration = ref(0);
let recordingTimer: any = null;

// Track participant media status
const participantMediaStatus = ref<
  Record<string, { camera: boolean; mic: boolean }>
>({});

const localVideo = ref<HTMLVideoElement | null>(null);
const localVideoThumb = ref<HTMLVideoElement | null>(null);
const localScreenVideo = ref<HTMLVideoElement | null>(null);
const remoteVideo = ref<HTMLVideoElement | null>(null);

// Store remote streams for each participant
const participantStreams = ref<Record<string, MediaStream>>({});
const screenShareStreams = ref<Record<string, MediaStream>>({});
const hasRemoteScreenShare = ref(false);
const whoIsSharing = ref<string | null>(null);

// Audio detection states
const isSpeaking = ref<Record<string, boolean>>({});
const showMicWarning = ref(false);
const localAudioLevel = ref(0);
let localAudioAnalyser: AnalyserNode | null = null;
let audioDetectionInterval: ReturnType<typeof setInterval> | null = null;

const debugLog = ref<string[]>([]);

const log = (msg: string) => {
  //   debugLog.value.slice(`[${new Date().toLocaleTimeString()}] ${msg}`);
  // log dan pastikan yang terbaru itu di bawah
  debugLog.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
  if (debugLog.value.length > 100) {
    debugLog.value.shift();
  }
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

let socket: Socket | null = null;
let peerConnections: Record<string, RTCPeerConnection> = {};
let localCameraStream: MediaStream | null = null;
let localScreenStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

// ICE server (STUN only for research)
const rtcConfig: RTCConfiguration = {
  iceServers: [
    // STUN (optional, buat dapat srflx)
    { urls: "stun:stun.l.google.com:19302" },

    // TURN UDP (utama buat relay)
    {
      urls: "turn:turn.rekrutmen-traspac.web.id:3478?transport=udp",
      username: "webrtcuser",
      credential: "strongpassword123",
    },

    // TURN TCP fallback (kalau UDP diblok)
    {
      urls: "turn:turn.rekrutmen-traspac.web.id:3478?transport=tcp",
      username: "webrtcuser",
      credential: "strongpassword123",
    },
  ],
};

// Watch isSpeaking changes for debugging
watch(
  isSpeaking,
  (newValue) => {
    const speakingUsers = Object.entries(newValue)
      .filter(([_, speaking]) => speaking)
      .map(([peerId, _]) => peerId.substring(0, 8));
    
    if (speakingUsers.length > 0) {
      log(`[WATCH] Currently speaking: ${speakingUsers.join(', ')}`);
    }
  },
  { deep: true }
);

// Watch for participant stream changes and update video elements
watch(
  participantStreams,
  (newStreams) => {
    nextTick(() => {
      for (const [peerId, stream] of Object.entries(newStreams)) {
        // Main video element
        const videoEl = document.getElementById(
          `video-${peerId}`,
        ) as HTMLVideoElement;
        if (videoEl && stream) {
          videoEl.srcObject = stream;
          videoEl.play().catch((e) => log(`[VIDEO] Error playing video-${peerId}: ${e.message}`));
        }

        // Thumbnail video element
        const thumbEl = document.getElementById(
          `thumb-${peerId}`,
        ) as HTMLVideoElement;
        if (thumbEl && stream) {
          thumbEl.srcObject = stream;
          thumbEl.play().catch((e) => log(`[VIDEO] Error playing thumb-${peerId}: ${e.message}`));
        }
        
        // Create hidden audio element for audio playback (important for recording)
        let audioEl = document.getElementById(`audio-${peerId}`) as HTMLAudioElement;
        if (!audioEl && stream.getAudioTracks().length > 0) {
          audioEl = document.createElement('audio');
          audioEl.id = `audio-${peerId}`;
          audioEl.autoplay = true;
          audioEl.srcObject = stream;
          document.body.appendChild(audioEl);
          audioEl.play().catch((e) => log(`[AUDIO] Error playing audio-${peerId}: ${e.message}`));
          log(`[AUDIO] Created hidden audio element for ${peerId}`);
        }
      }
    });
  },
  { deep: true },
);

// Watch for local camera stream and update local video elements
watch(
  () => localCameraStream,
  (newStream) => {
    nextTick(() => {
      if (localVideo.value) {
        localVideo.value.srcObject = newStream;
      }
      if (localVideoThumb.value) {
        localVideoThumb.value.srcObject = newStream;
      }
    });
  },
);

function ensurePC(peerId: string) {
  if (peerConnections[peerId]) return peerConnections[peerId];

  const pc = new RTCPeerConnection(rtcConfig);

  pc.onicecandidate = (event) => {
    if (event.candidate && socket) {
      socket.emit("webrtc-ice-candidate", {
        roomId: roomId.value,
        candidate: event.candidate,
        targetId: peerId,
      });
    }
  };

  pc.onconnectionstatechange = () => {
    log(`PC[${peerId}] connectionState = ${pc.connectionState}`);
  };

  pc.oniceconnectionstatechange = () => {
    log(`PC[${peerId}] iceConnectionState = ${pc.iceConnectionState}`);
  };

  pc.ontrack = (event) => {
    log(`Remote track received from ${peerId}: ${event.track.kind}, streamId: ${event.streams[0]?.id?.substring(0, 8) || 'no-stream'}`);
    
    if (event.streams[0]) {
      const stream = event.streams[0];
      const streamId = stream.id;
      
      // Log all tracks in this stream
      log(`[TRACK] Stream ${streamId.substring(0, 8)} has ${stream.getVideoTracks().length} video, ${stream.getAudioTracks().length} audio tracks`);

      // Check if this peer is currently sharing (via socket state)
      if (whoIsSharing.value === peerId) {
        // This peer is sharing screen - need to determine if this is screen or camera
        // Screen share typically comes as a separate stream after camera
        
        // If we already have a camera stream for this peer, this new one is likely screen share
        if (participantStreams.value[peerId] && participantStreams.value[peerId].id !== streamId) {
          log(`[TRACK] Screen share stream from ${peerId} (second stream)`);
          screenShareStreams.value[peerId] = stream;
          hasRemoteScreenShare.value = true;

          nextTick(() => {
            if (remoteVideo.value) {
              remoteVideo.value.srcObject = stream;
              remoteVideo.value.play().catch((e) => log(`[VIDEO] Error playing remoteVideo: ${e.message}`));
              log(`Set remoteVideo srcObject for ${peerId}`);
            }
          });
        } else if (!participantStreams.value[peerId]) {
          // First stream from a sharer - could be camera, store it but check later
          log(`[TRACK] First stream from sharing peer ${peerId}, treating as camera`);
          participantStreams.value[peerId] = stream;
        } else {
          // Same stream ID, update it
          log(`[TRACK] Updated existing stream for ${peerId}`);
          participantStreams.value[peerId] = stream;
        }
      } else {
        // Not sharing - this is a regular camera stream
        log(`[TRACK] Camera stream from ${peerId}`);
        participantStreams.value[peerId] = stream;
      }
      
      // Setup audio detection for remote stream
      log(`[TRACK] Calling setupRemoteAudioDetection for ${peerId}...`);
      setupRemoteAudioDetection(peerId, stream);
      
      // Force video element to play after short delay
      setTimeout(() => {
        const videoEl = document.getElementById(`video-${peerId}`) as HTMLVideoElement;
        if (videoEl && videoEl.srcObject) {
          videoEl.play().catch(() => {});
        }
      }, 100);
    }
  };

  peerConnections[peerId] = pc;

  // Add local camera stream if enabled (camera stream)
  if (localCameraStream) {
    localCameraStream.getTracks().forEach((track) => {
      pc.addTrack(track, localCameraStream!);
    });
  }

  // Add screen share stream if currently sharing
  if (localScreenStream && sharing.value) {
    localScreenStream.getTracks().forEach((track) => {
      pc.addTrack(track, localScreenStream!);
    });
  }

  return pc;
}

async function joinRoom() {
  if (import.meta.server) return; // only client

  // If already joined, disconnect
  if (joined.value && socket) {
    // Stop sharing first if sharing
    if (sharing.value) {
      stopSharing();
    }

    // Stop camera if enabled
    if (cameraEnabled.value) {
      if (localCameraStream) {
        const videoTracks = localCameraStream.getVideoTracks();
        videoTracks.forEach((track) => track.stop());
      }
      cameraEnabled.value = false;
      if (localVideo.value) localVideo.value.srcObject = null;
      log("Camera stopped on disconnect");
    }

    // Stop mic if enabled
    if (micEnabled.value) {
      if (localCameraStream) {
        const audioTracks = localCameraStream.getAudioTracks();
        audioTracks.forEach((track) => track.stop());
      }
      micEnabled.value = false;
      log("Mic stopped on disconnect");
    }

    // Clear local camera stream completely
    localCameraStream = null;

    // Close all peer connections
    Object.values(peerConnections).forEach((pc) => pc.close());
    peerConnections = {};

    // Clear all streams and states
    participantStreams.value = {};
    screenShareStreams.value = {};
    participantMediaStatus.value = {};
    whoIsSharing.value = null;
    hasRemoteScreenShare.value = false;

    socket.disconnect();
    socket = null;
    joined.value = false;
    participants.value = [];

    log("Disconnected from room and reset all states");
    return;
  }

  // Join room
  socket = io(socketUrl, {
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    log(`Socket connected: ${socket?.id}`);
    socket?.emit("join-room", roomId.value);
  });

  socket.on(
    "joined-room",
    ({ roomId: rid, socketId, participants: par, whoIsSharing: sharing, isRecording: rec, whoIsRecording: recorder }: any) => {
      joined.value = true;
      // Host is the first person in the room
      isHost.value = par.length === 1 && par[0] === socketId;
      log(`Joined room: ${rid} as ${socketId} ${isHost.value ? "(HOST)" : ""}`);
      log(`[AUDIO DETECTION] Initial state - cameraEnabled: ${cameraEnabled.value}, micEnabled: ${micEnabled.value}`);
      handleParticipantListUpdate(par);

      // Handle initial screen share state
      if (sharing && sharing !== socketId) {
        log(`[INITIAL STATE] ${sharing} is currently sharing screen`);
        whoIsSharing.value = sharing;
        hasRemoteScreenShare.value = true;
      }
      
      // Handle initial recording state
      if (rec && recorder) {
        log(`[INITIAL STATE] Meeting is being recorded by ${recorder}`);
        if (recorder !== socketId) {
          // Someone else is recording, show recording indicator
          recording.value = true;
          log(`[INITIAL STATE] Showing recording indicator for non-host`);
        }
      }

      // Request current media status from all existing participants
      if (par.length > 1) {
        socket?.emit("request-media-status", { roomId: rid });
      }
    },
  );

  socket.on("room-participants", ({ participants: par }: any) => {
    log(`Current participants in room: ${par.join(", ") || "none"}`);
    handleParticipantListUpdate(par);
  });

  socket.on("room-full", () => {
    log("Room full (max 2 users). Use another Room ID.");
  });

  socket.on("user-connected", async ({ socketId, participants: par }: any) => {
    log(`User connected: ${socketId}`);
    handleParticipantListUpdate(par);

    // Initialize media status for new participant
    participantMediaStatus.value[socketId] = { camera: false, mic: false };

    // Request media status from the new participant
    socket?.emit("request-media-status", { roomId: roomId.value });

    // If I have camera enabled, create peer connection and send offer
    if (cameraEnabled.value || sharing.value) {
      await createAndSendOffer(socketId);
    }
  });

  socket.on("user-disconnected", ({ socketId, participants: par }: any) => {
    handleParticipantListUpdate(par);
    log(`User disconnected: ${socketId}`);
    // Cleanup peer connection and streams
    if (peerConnections[socketId]) {
      peerConnections[socketId].close();
      delete peerConnections[socketId];
    }
    delete participantStreams.value[socketId];
    delete screenShareStreams.value[socketId];
    delete participantMediaStatus.value[socketId];
    
    // Cleanup hidden audio element
    const audioEl = document.getElementById(`audio-${socketId}`);
    if (audioEl) {
      audioEl.remove();
      log(`[AUDIO] Removed hidden audio element for ${socketId}`);
    }

    // Clear who is sharing if this user was sharing
    if (whoIsSharing.value === socketId) {
      whoIsSharing.value = null;
      hasRemoteScreenShare.value = false;
      if (remoteVideo.value) remoteVideo.value.srcObject = null;
    }
  });

  socket.on("sharing-stopped", ({ socketId }: any) => {
    log(`User ${socketId} stopped sharing`);

    // Clear who is sharing
    if (whoIsSharing.value === socketId) {
      whoIsSharing.value = null;
    }

    // Remove screen share stream for this user
    delete screenShareStreams.value[socketId];

    // Update state
    hasRemoteScreenShare.value = false;
    if (remoteVideo.value) {
      remoteVideo.value.srcObject = null;
    }
  });

  socket.on("sharing-started", ({ socketId }: any) => {
    log(`User ${socketId} started sharing`);
    whoIsSharing.value = socketId;
    
    // Note: The screen share stream will come via ontrack event
    // We set whoIsSharing first so ontrack knows to treat new streams as screen share
    log(`[SHARE] Ready to receive screen share from ${socketId}`);
  });

  socket.on("recording-started", ({ socketId }: any) => {
    log(`Recording started by ${socketId}`);
    
    // Set recording state for all users (including non-host)
    recording.value = true;
    
    // Show toast notification for non-host participants
    if (socket?.id !== socketId) {
      log(`[NOTIFICATION] Host ${socketId.substring(0, 8)} is recording this meeting`);
      // Toast: "Meeting sedang direkam oleh Host"
    }
  });

  socket.on("recording-stopped", ({ socketId }: any) => {
    log(`Recording stopped by ${socketId}`);
    
    // Clear recording state for all users
    if (socket?.id !== socketId) {
      recording.value = false;
      log(`[NOTIFICATION] Host stopped recording`);
      // Toast: "Rekaman dihentikan. Sedang diproses…"
    }
  });

  // Camera & Mic status events
  socket.on("camera-toggled", ({ socketId, enabled }: any) => {
    log(`User ${socketId} ${enabled ? "enabled" : "disabled"} camera`);
    if (!participantMediaStatus.value[socketId]) {
      participantMediaStatus.value[socketId] = { camera: false, mic: false };
    }
    participantMediaStatus.value[socketId].camera = enabled;
  });

  socket.on("mic-toggled", ({ socketId, enabled }: any) => {
    log(`User ${socketId} ${enabled ? "enabled" : "disabled"} mic`);
    if (!participantMediaStatus.value[socketId]) {
      participantMediaStatus.value[socketId] = { camera: false, mic: false };
    }
    participantMediaStatus.value[socketId].mic = enabled;
  });

  // Speaking status events
  socket.on("speaking-status", ({ socketId, speaking }: any) => {
    log(`[SOCKET] Received speaking-status from ${socketId.substring(0, 8)}: ${speaking}`);
    isSpeaking.value[socketId] = speaking;
    log(`[SOCKET] Updated isSpeaking state for ${socketId.substring(0, 8)}: ${isSpeaking.value[socketId]}`);
  });

  socket.on("media-status-requested", ({ requesterId }: any) => {
    // Send current media status to requester
    log(
      `Sending media status to ${requesterId}: cam=${cameraEnabled.value}, mic=${micEnabled.value}`,
    );
    socket?.emit("media-status", {
      roomId: roomId.value,
      targetId: requesterId,
      cameraEnabled: cameraEnabled.value,
      micEnabled: micEnabled.value,
    });
  });

  socket.on(
    "participant-media-status",
    ({ socketId, cameraEnabled: camEnabled, micEnabled: micEn }: any) => {
      log(
        `Received media status from ${socketId}: cam=${camEnabled}, mic=${micEn}`,
      );
      if (!participantMediaStatus.value[socketId]) {
        participantMediaStatus.value[socketId] = { camera: false, mic: false };
      }
      participantMediaStatus.value[socketId].camera = camEnabled;
      participantMediaStatus.value[socketId].mic = micEn;
    },
  );

  socket.on("webrtc-offer", async ({ socketId, offer }: any) => {
    log(`Received offer from ${socketId}`);
    const peer = ensurePC(socketId);

    // Important: setRemoteDescription before answering
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket?.emit("webrtc-answer", {
      roomId: roomId.value,
      answer,
      targetId: socketId,
    });
    log(`Answer sent to ${socketId}`);
  });

  socket.on("webrtc-answer", async ({ socketId, answer }: any) => {
    log(`Received answer from ${socketId}`);
    const peer = ensurePC(socketId);
    await peer.setRemoteDescription(new RTCSessionDescription(answer));
  });

  socket.on("webrtc-ice-candidate", async ({ socketId, candidate }: any) => {
    try {
      const peer = ensurePC(socketId);
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err: any) {
      log(`addIceCandidate error from ${socketId}: ${err?.message || err}`);
    }
  });

  socket.on("disconnect", () => {
    log("Socket disconnected");
  });
}

const handleParticipantListUpdate = (par: string[]) => {
  participants.value = par
    .sort((a: any, b: any) =>
      a === socket?.id ? -1 : b === socket?.id ? 1 : 0,
    )
    .map((p: any) => (p === socket?.id ? `${p} (You)` : p));
};

async function toggleCamera() {
  if (cameraEnabled.value) {
    // Disable camera
    cameraEnabled.value = false;

    // Remove video tracks from all peer connections
    for (const [peerId, pc] of Object.entries(peerConnections)) {
      const senders = pc.getSenders();
      const videoSender = senders.find(
        (sender) => sender.track?.kind === "video",
      );
      if (videoSender && videoSender.track) {
        pc.removeTrack(videoSender);
      }
    }

    // Stop local camera stream
    if (localCameraStream) {
      const videoTracks = localCameraStream.getVideoTracks();
      videoTracks.forEach((track) => track.stop());

      // If no audio tracks, clear the stream completely
      if (localCameraStream.getAudioTracks().length === 0) {
        localCameraStream = null;
      }
    }

    if (localVideo.value) localVideo.value.srcObject = null;

    // Renegotiate with all peers
    for (const participant of participants.value) {
      const peerId = participant.split(" ")[0];
      if (peerId !== socket?.id) {
        await createAndSendOffer(peerId);
      }
    }

    log("Camera disabled");
  } else {
    // Enable camera
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false, // Don't request audio here, mic controls it separately
      });

      const videoTrack = newStream.getVideoTracks()[0];

      // Add video track to existing stream or create new one
      if (localCameraStream) {
        localCameraStream.addTrack(videoTrack);
      } else {
        localCameraStream = newStream;
      }

      cameraEnabled.value = true;

      if (localVideo.value) {
        localVideo.value.srcObject = localCameraStream;
      }

      // Add video track to all existing peer connections
      for (const [peerId, pc] of Object.entries(peerConnections)) {
        pc.addTrack(videoTrack, localCameraStream);
      }

      // Renegotiate with all peers
      for (const participant of participants.value) {
        const peerId = participant.split(" ")[0];
        if (peerId !== socket?.id) {
          await createAndSendOffer(peerId);
        }
      }

      log("Camera enabled");
    } catch (err: any) {
      log(`Camera error: ${err?.message || err}`);
    }
  }

  // Broadcast camera status
  socket?.emit("camera-toggled", {
    roomId: roomId.value,
    enabled: cameraEnabled.value,
  });
}

async function toggleMic() {
  if (micEnabled.value) {
    // Disable mic
    log("[MIC] Disabling microphone...");
    micEnabled.value = false;
    
    // Clear speaking state for local user
    if (socket?.id) {
      isSpeaking.value[socket.id] = false;
      log("[MIC] Cleared local speaking state");
    }

    // Remove audio tracks from all peer connections
    for (const [peerId, pc] of Object.entries(peerConnections)) {
      const senders = pc.getSenders();
      const audioSender = senders.find(
        (sender) => sender.track?.kind === "audio",
      );
      if (audioSender && audioSender.track) {
        pc.removeTrack(audioSender);
      }
    }

    // Stop local audio stream
    if (localCameraStream) {
      const audioTracks = localCameraStream.getAudioTracks();
      audioTracks.forEach((track) => track.stop());

      // If no video tracks, clear the stream completely
      if (localCameraStream.getVideoTracks().length === 0) {
        localCameraStream = null;
        if (localVideo.value) localVideo.value.srcObject = null;
      }
    }

    // Renegotiate with all peers
    for (const participant of participants.value) {
      const peerId = participant.split(" ")[0];
      if (peerId !== socket?.id) {
        await createAndSendOffer(peerId);
      }
    }

    log("Microphone disabled");
  } else {
    // Enable mic
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });

      const audioTrack = newStream.getAudioTracks()[0];

      // Add audio track to existing stream or create new one
      if (localCameraStream) {
        localCameraStream.addTrack(audioTrack);
      } else {
        localCameraStream = newStream;
      }

      micEnabled.value = true;

      // Update local video if exists
      if (localVideo.value && localCameraStream) {
        localVideo.value.srcObject = localCameraStream;
      }

      // Add audio track to all existing peer connections
      for (const [peerId, pc] of Object.entries(peerConnections)) {
        pc.addTrack(audioTrack, localCameraStream);
      }

      // Renegotiate with all peers
      for (const participant of participants.value) {
        const peerId = participant.split(" ")[0];
        if (peerId !== socket?.id) {
          await createAndSendOffer(peerId);
        }
      }

      // Start audio detection for local mic
      log("[MIC] Calling startLocalAudioDetection()...");
      startLocalAudioDetection();

      log("Microphone enabled");
    } catch (err: any) {
      log(`Microphone error: ${err?.message || err}`);
    }
  }

  // Broadcast mic status
  socket?.emit("mic-toggled", {
    roomId: roomId.value,
    enabled: micEnabled.value,
  });
}

async function startShareScreen() {
  if (!socket) {
    log("Socket not connected yet. Join room first.");
    return;
  }

  if (sharing.value) {
    stopSharing();
    return;
  }

  try {
    localScreenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    sharing.value = true;
    log("Screen capture started");

    // Display local screen share preview
    nextTick(() => {
      if (localScreenVideo.value) {
        localScreenVideo.value.srcObject = localScreenStream;
        log("Local screen preview set");
      }
    });

    // Notify others that you started sharing
    socket.emit("sharing-started", { roomId: roomId.value });

    // Add screen share tracks to peer connections as NEW stream (don't replace camera)
    const screenTracks = localScreenStream.getTracks();
    for (const [peerId, pc] of Object.entries(peerConnections)) {
      screenTracks.forEach((track) => {
        // Add with the screen share stream (separate from camera stream)
        pc.addTrack(track, localScreenStream!);
      });
    }

    // When user stops sharing from browser UI
    const videoTrack = localScreenStream.getVideoTracks()[0];
    videoTrack.onended = () => {
      log("Screen sharing ended by user");
      stopSharing();
    };

    // Create offers for all participants
    for (const participant of participants.value) {
      const peerId = participant.split(" ")[0];
      if (peerId !== socket?.id) {
        await createAndSendOffer(peerId);
      }
    }
  } catch (err: any) {
    log(`getDisplayMedia error: ${err?.message || err}`);
  }
}

async function createAndSendOffer(targetPeerId: string) {
  if (!socket) return;
  const peer = ensurePC(targetPeerId);

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);

  socket.emit("webrtc-offer", {
    roomId: roomId.value,
    offer,
    targetId: targetPeerId,
  });
  log(`Offer sent to ${targetPeerId}`);
}

function stopSharing() {
  sharing.value = false;

  // Stop recording if still recording
  if (recording.value) {
    stopRecording();
  }

  // Remove ONLY screen share tracks from all peer connections
  if (localScreenStream) {
    const screenTracks = localScreenStream.getTracks();

    for (const [peerId, pc] of Object.entries(peerConnections)) {
      const senders = pc.getSenders();

      // Remove senders that are sending screen share tracks
      for (const sender of senders) {
        if (sender.track && screenTracks.includes(sender.track)) {
          log(`Removing screen track from PC[${peerId}]: ${sender.track.kind}`);
          pc.removeTrack(sender);
        }
      }
    }

    // Stop screen stream tracks
    screenTracks.forEach((t) => t.stop());
  }

  // Notify others that you stopped sharing
  if (socket) {
    socket.emit("stop-sharing", { roomId: roomId.value });
  }

  localScreenStream = null;

  if (localScreenVideo.value) {
    localScreenVideo.value.srcObject = null;
  }

  // Renegotiate with all peers to update connections
  for (const participant of participants.value) {
    const peerId = participant.split(" ")[0];
    if (peerId !== socket?.id) {
      createAndSendOffer(peerId);
    }
  }

  log("Stopped sharing (camera/mic preserved)");
}

async function startRecording() {
  log("[START] startRecording() called");

  // Check if host
  if (!isHost.value) {
    log("Only host can record");
    return;
  }

  try {
    recordedChunks = [];

    // Create canvas for composite recording
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    log("[CANVAS] Canvas created: 1920x1080");

    // Note: Video sources are now collected dynamically in renderFrame()
    // to support layout changes during recording

    // Note: Recording dapat dimulai bahkan tanpa video sources
    // Canvas akan render placeholder untuk participants tanpa camera
    // Video sources will be collected dynamically in each frame
    log(`[RECORDING] Starting recording with ${participants.value.length} participants`);

    // Wait a bit for video elements to be ready (important for remote streams)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Set recording flag BEFORE starting render loop
    recording.value = true;

    // Rendering function
    let frameCount = 0;
    const renderFrame = () => {
      if (!recording.value) {
        log("[RENDERER] Recording stopped, ending render loop");
        return;
      }

      frameCount++;
      if (frameCount % 60 === 0) {
        log(`[RENDERER] ✅ Rendered ${frameCount} frames`);
      }

      // Clear canvas
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // DYNAMIC LAYOUT DETECTION - check every frame
      const currentHasScreenShare = sharing.value || hasRemoteScreenShare.value;
      
      // Collect current video sources dynamically
      const currentVideoSources: {
        element: HTMLVideoElement;
        label: string;
        type: "screen" | "participant";
      }[] = [];

      if (currentHasScreenShare) {
        // Get screen share video element
        if (sharing.value && localScreenVideo.value?.srcObject) {
          currentVideoSources.push({
            element: localScreenVideo.value,
            label: "local-screen",
            type: "screen",
          });
        } else if (hasRemoteScreenShare.value && remoteVideo.value?.srcObject) {
          currentVideoSources.push({
            element: remoteVideo.value,
            label: whoIsSharing.value || "remote-screen",
            type: "screen",
          });
        }

        // Add participant videos
        if (cameraEnabled.value && localVideo.value?.srcObject) {
          currentVideoSources.push({
            element: localVideo.value,
            label: "local-cam",
            type: "participant",
          });
        }

        for (const [peerId] of Object.entries(participantStreams.value)) {
          const videoEl = document.getElementById(`video-${peerId}`) as HTMLVideoElement;
          if (videoEl && videoEl.srcObject) {
            currentVideoSources.push({
              element: videoEl,
              label: peerId,
              type: "participant",
            });
          }
        }
      } else {
        // Grid layout - collect all participant videos
        if (cameraEnabled.value && localVideo.value?.srcObject) {
          currentVideoSources.push({
            element: localVideo.value,
            label: "local",
            type: "participant",
          });
        }

        for (const [peerId] of Object.entries(participantStreams.value)) {
          const videoEl = document.getElementById(`video-${peerId}`) as HTMLVideoElement;
          if (videoEl && videoEl.srcObject) {
            currentVideoSources.push({
              element: videoEl,
              label: peerId,
              type: "participant",
            });
          }
        }
      }

      if (currentHasScreenShare) {
        // Render screen share + participant overlay layout
        const screenSource = currentVideoSources.find((s) => s.type === "screen");
        const participantSources = currentVideoSources.filter((s) => s.type === "participant");

        if (screenSource) {
          const mainAreaWidth = canvas.width * 0.8;
          const mainAreaHeight = canvas.height;
          try {
            const videoEl = screenSource.element;
            // Ensure video is playing and has valid dimensions
            if (videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
              if (videoEl.paused) {
                videoEl.play().catch(() => {});
              }
              
              // Calculate aspect-ratio preserving dimensions
              const videoAspect = videoEl.videoWidth / videoEl.videoHeight;
              const areaAspect = mainAreaWidth / mainAreaHeight;
              
              let drawWidth, drawHeight, drawX, drawY;
              
              if (videoAspect > areaAspect) {
                // Video is wider than area - fit to width
                drawWidth = mainAreaWidth;
                drawHeight = mainAreaWidth / videoAspect;
                drawX = 0;
                drawY = (mainAreaHeight - drawHeight) / 2; // Center vertically
              } else {
                // Video is taller than area - fit to height
                drawHeight = mainAreaHeight;
                drawWidth = mainAreaHeight * videoAspect;
                drawX = (mainAreaWidth - drawWidth) / 2; // Center horizontally
                drawY = 0;
              }
              
              // Fill background first
              ctx.fillStyle = '#0a0a0a';
              ctx.fillRect(0, 0, mainAreaWidth, mainAreaHeight);
              
              // Draw video with correct aspect ratio
              ctx.drawImage(videoEl, drawX, drawY, drawWidth, drawHeight);
            } else {
              // Log video state for debugging
              if (frameCount % 60 === 0) {
                log(`[RENDERER] Screen video not ready - readyState: ${videoEl.readyState}, width: ${videoEl.videoWidth}, height: ${videoEl.videoHeight}, paused: ${videoEl.paused}`);
              }
              // Draw placeholder if video not ready
              ctx.fillStyle = '#1a1a1a';
              ctx.fillRect(0, 0, mainAreaWidth, mainAreaHeight);
              ctx.fillStyle = '#888';
              ctx.font = '48px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('Loading screen share...', mainAreaWidth / 2, mainAreaHeight / 2);
            }
          } catch (e: any) {
            log(`[RENDERER] Error drawing screen: ${e.message}`);
          }
        }

        // Draw participant sidebar (with or without video)
        const sidebarX = canvas.width * 0.8;
        const sidebarWidth = canvas.width * 0.2;
        const allParticipants = participants.value;
        const participantHeight = Math.min(240, canvas.height / Math.max(allParticipants.length, 1));

        allParticipants.forEach((participant, index) => {
          const y = index * participantHeight;
          const peerId = participant.split(" ")[0];
          const isLocalUser = participant.includes("(You)");
          
          // Find video source for this participant
          const participantVideo = participantSources.find(s => 
            (isLocalUser && s.label === 'local-cam') || s.label === peerId
          );

          if (participantVideo) {
            // Draw video if available
            try {
              const videoEl = participantVideo.element;
              // Ensure video is playing and ready
              if (videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
                if (videoEl.paused) {
                  videoEl.play().catch(() => {});
                }
                
                // Calculate aspect ratio preserving dimensions for sidebar
                const videoAspect = videoEl.videoWidth / videoEl.videoHeight;
                const cellAspect = sidebarWidth / participantHeight;
                
                let drawWidth, drawHeight, drawX, drawY;
                
                if (videoAspect > cellAspect) {
                  // Video is wider - fit to width, crop height
                  drawWidth = sidebarWidth;
                  drawHeight = sidebarWidth / videoAspect;
                  drawX = sidebarX;
                  drawY = y + (participantHeight - drawHeight) / 2;
                } else {
                  // Video is taller - fit to height, crop width
                  drawHeight = participantHeight;
                  drawWidth = participantHeight * videoAspect;
                  drawX = sidebarX + (sidebarWidth - drawWidth) / 2;
                  drawY = y;
                }
                
                // Fill cell background
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(sidebarX, y, sidebarWidth, participantHeight);
                
                // Draw video with aspect ratio
                ctx.drawImage(videoEl, drawX, drawY, drawWidth, drawHeight);
              } else {
                // Log video state for debugging
                if (frameCount % 120 === 0) {
                  log(`[RENDERER] Sidebar video ${peerId} not ready - readyState: ${videoEl.readyState}, width: ${videoEl.videoWidth}, paused: ${videoEl.paused}`);
                }
                // Draw placeholder if video not ready
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(sidebarX, y, sidebarWidth, participantHeight);
                ctx.fillStyle = '#555';
                ctx.font = `${participantHeight / 3}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('👤', sidebarX + sidebarWidth / 2, y + participantHeight / 2 - 15);
                ctx.fillStyle = '#888';
                ctx.font = `${participantHeight / 8}px sans-serif`;
                ctx.fillText('Loading...', sidebarX + sidebarWidth / 2, y + participantHeight / 2 + 20);
              }
            } catch (e: any) {
              log(`[RENDERER] Error drawing participant ${participant}: ${e.message}`);
            }
          } else {
            // Draw placeholder for participant without camera
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(sidebarX, y, sidebarWidth, participantHeight);
            
            // Draw icon
            ctx.fillStyle = '#555';
            ctx.font = '48px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👤', sidebarX + sidebarWidth / 2, y + participantHeight / 2 - 20);
            
            // Draw "Camera Off" text
            ctx.fillStyle = '#888';
            ctx.font = '12px sans-serif';
            ctx.fillText('Camera Off', sidebarX + sidebarWidth / 2, y + participantHeight / 2 + 20);
          }
          
          // Draw border
          ctx.strokeStyle = '#444';
          ctx.lineWidth = 2;
          ctx.strokeRect(sidebarX, y, sidebarWidth, participantHeight);

          // Draw name label
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(sidebarX + 5, y + participantHeight - 30, sidebarWidth - 10, 25);

          ctx.fillStyle = '#fff';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(
            isLocalUser ? 'You' : peerId.substring(0, 8), 
            sidebarX + 10, 
            y + participantHeight - 10
          );
        });
      } else {
        // Render grid layout for all participants (with or without video)
        const allParticipants = participants.value;
        const participantCount = allParticipants.length;
        
        if (participantCount === 0) {
          // No participants at all - show waiting message
          ctx.fillStyle = '#fff';
          ctx.font = '48px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Waiting for participants...', canvas.width / 2, canvas.height / 2);
        } else {
          // Calculate grid layout
          const cols = Math.ceil(Math.sqrt(participantCount));
          const rows = Math.ceil(participantCount / cols);
          const cellWidth = canvas.width / cols;
          const cellHeight = canvas.height / rows;

          allParticipants.forEach((participant, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = col * cellWidth;
            const y = row * cellHeight;
            const peerId = participant.split(" ")[0];
            const isLocalUser = participant.includes("(You)");

            // Find video source for this participant
            const participantVideo = currentVideoSources.find(s => 
              (isLocalUser && s.label === 'local') || s.label === peerId
            );

            if (participantVideo) {
              // Draw video if available
              try {
                const videoEl = participantVideo.element;
                // Ensure video is playing and ready
                if (videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
                  if (videoEl.paused) {
                    videoEl.play().catch(() => {});
                  }
                  
                  // Calculate aspect ratio preserving dimensions
                  const videoAspect = videoEl.videoWidth / videoEl.videoHeight;
                  const cellAspect = cellWidth / cellHeight;
                  
                  let drawWidth, drawHeight, drawX, drawY;
                  
                  if (videoAspect > cellAspect) {
                    // Video is wider - fit to width
                    drawWidth = cellWidth;
                    drawHeight = cellWidth / videoAspect;
                    drawX = x;
                    drawY = y + (cellHeight - drawHeight) / 2;
                  } else {
                    // Video is taller - fit to height
                    drawHeight = cellHeight;
                    drawWidth = cellHeight * videoAspect;
                    drawX = x + (cellWidth - drawWidth) / 2;
                    drawY = y;
                  }
                  
                  // Fill cell background first
                  ctx.fillStyle = '#1a1a1a';
                  ctx.fillRect(x, y, cellWidth, cellHeight);
                  
                  // Draw video with correct aspect ratio
                  ctx.drawImage(videoEl, drawX, drawY, drawWidth, drawHeight);
                } else {
                  // Draw placeholder if video not ready
                  ctx.fillStyle = '#1a1a1a';
                  ctx.fillRect(x, y, cellWidth, cellHeight);
                  ctx.fillStyle = '#555';
                  ctx.font = `${Math.min(cellWidth, cellHeight) / 3}px sans-serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText('👤', x + cellWidth / 2, y + cellHeight / 2 - 30);
                  ctx.fillStyle = '#888';
                  ctx.font = `${Math.min(cellWidth, cellHeight) / 12}px sans-serif`;
                  ctx.fillText('Loading...', x + cellWidth / 2, y + cellHeight / 2 + 30);
                }
              } catch (e: any) {
                log(`[RENDERER] Error drawing grid participant ${participant}: ${e.message}`);
              }
            } else {
              // Draw placeholder for participant without camera
              ctx.fillStyle = '#1a1a1a';
              ctx.fillRect(x, y, cellWidth, cellHeight);
              
              // Draw icon
              ctx.fillStyle = '#555';
              ctx.font = `${Math.min(cellWidth, cellHeight) / 3}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('👤', x + cellWidth / 2, y + cellHeight / 2 - 30);
              
              // Draw "Camera Off" text
              ctx.fillStyle = '#888';
              ctx.font = `${Math.min(cellWidth, cellHeight) / 12}px sans-serif`;
              ctx.fillText('Camera Off', x + cellWidth / 2, y + cellHeight / 2 + 30);
            }
            
            // Draw border
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, cellWidth, cellHeight);

            // Draw name label
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x + 10, y + cellHeight - 40, 150, 30);

            ctx.fillStyle = '#fff';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(
              isLocalUser ? 'You' : peerId.substring(0, 12), 
              x + 15, 
              y + cellHeight - 15
            );
          });
        }
      }

      requestAnimationFrame(renderFrame);
    };

    // Start render loop
    log("[RENDERER] Starting render loop...");
    renderFrame();

    // Wait for first frame
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Capture canvas stream
    const canvasStream = canvas.captureStream(30);
    log(`[CANVAS] Stream captured at 30 FPS`);

    // Debug track health
    const canvasVideoTrack = canvasStream.getVideoTracks()[0];
    if (!canvasVideoTrack) {
      log("[ERROR] No video track produced by canvas.captureStream()");
      recording.value = false;
      return;
    }

    log(
      `[CANVAS] VideoTrack state=${canvasVideoTrack.readyState}, muted=${(canvasVideoTrack as any).muted ?? "?"}, enabled=${canvasVideoTrack.enabled
      }`
    );

    // -------- AUDIO MIX --------
    const audioContext = new AudioContext();

    // Ensure audio context is running (important for some browsers)
    if (audioContext.state === "suspended") {
      await audioContext.resume();
      log("[AUDIO] AudioContext resumed");
    }

    const audioDestination = audioContext.createMediaStreamDestination();
    let audioSourceCount = 0;

    // Add local mic audio
    if (localCameraStream && micEnabled.value) {
      const audioTracks = localCameraStream.getAudioTracks();
      log(`[AUDIO] Local mic - tracks: ${audioTracks.length}, micEnabled: ${micEnabled.value}`);
      if (audioTracks.length > 0) {
        const track = audioTracks[0];
        log(`[AUDIO] Local mic track - enabled: ${track.enabled}, muted: ${track.muted}, readyState: ${track.readyState}`);
        const source = audioContext.createMediaStreamSource(new MediaStream([track]));
        source.connect(audioDestination);
        audioSourceCount++;
        log("[AUDIO] ✅ Added local mic audio");
      }
    }

    // Add screen share audio
    if (sharing.value && localScreenStream) {
      const audioTracks = localScreenStream.getAudioTracks();
      log(`[AUDIO] Local screen share - tracks: ${audioTracks.length}`);
      if (audioTracks.length > 0) {
        const track = audioTracks[0];
        log(`[AUDIO] Screen share track - enabled: ${track.enabled}, muted: ${track.muted}, readyState: ${track.readyState}`);
        const source = audioContext.createMediaStreamSource(new MediaStream([track]));
        source.connect(audioDestination);
        audioSourceCount++;
        log("[AUDIO] ✅ Added screen share audio");
      }
    }

    // Add remote participant audio
    log(`[AUDIO] Checking remote participants - count: ${Object.keys(participantStreams.value).length}`);
    for (const [peerId, stream] of Object.entries(participantStreams.value)) {
      const audioTracks = stream.getAudioTracks();
      log(`[AUDIO] Participant ${peerId} - audio tracks: ${audioTracks.length}`);
      if (audioTracks.length > 0) {
        try {
          const track = audioTracks[0];
          log(`[AUDIO] Participant ${peerId} track - enabled: ${track.enabled}, muted: ${track.muted}, readyState: ${track.readyState}`);
          const source = audioContext.createMediaStreamSource(new MediaStream([track]));
          source.connect(audioDestination);
          audioSourceCount++;
          log(`[AUDIO] ✅ Added audio from ${peerId}`);
        } catch (e: any) {
          log(`[AUDIO] ❌ Error adding audio from ${peerId}: ${e.message}`);
        }
      }
    }

    // Add remote screen share audio (important for capturing shared audio)
    log(`[AUDIO] Checking remote screen shares - count: ${Object.keys(screenShareStreams.value).length}`);
    for (const [peerId, stream] of Object.entries(screenShareStreams.value)) {
      const audioTracks = stream.getAudioTracks();
      log(`[AUDIO] Screen share from ${peerId} - audio tracks: ${audioTracks.length}`);
      if (audioTracks.length > 0) {
        try {
          const track = audioTracks[0];
          log(`[AUDIO] Screen share ${peerId} track - enabled: ${track.enabled}, muted: ${track.muted}, readyState: ${track.readyState}`);
          const source = audioContext.createMediaStreamSource(new MediaStream([track]));
          source.connect(audioDestination);
          audioSourceCount++;
          log(`[AUDIO] ✅ Added screen share audio from ${peerId}`);
        } catch (e: any) {
          log(`[AUDIO] ❌ Error adding screen share audio from ${peerId}: ${e.message}`);
        }
      }
    }

    // If no audio sources, inject nearly-silent audio to avoid encoder edge cases
    // (Some environments return 0 chunks when audio track exists but is "dead" or context suspended)
    if (audioSourceCount === 0) {
      try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        gain.gain.value = 0.00001; // almost silent
        osc.connect(gain).connect(audioDestination);
        osc.start();
        log("[AUDIO] No real audio sources. Injected silent oscillator track for stability.");
      } catch (e: any) {
        log(`[AUDIO] Failed to inject silent track: ${e.message}`);
      }
    }

    log(`[AUDIO] Total audio sources mixed: ${audioSourceCount}`);

    // Combine video from canvas and mixed audio
    const recordStream = new MediaStream();
    canvasStream.getVideoTracks().forEach((track) => recordStream.addTrack(track));
    audioDestination.stream.getAudioTracks().forEach((track) => recordStream.addTrack(track));

    log(
      `[STREAM] Final stream - video: ${recordStream.getVideoTracks().length}, audio: ${recordStream.getAudioTracks().length
      }`
    );

    // -------- MIME TYPE FIX (CRITICAL) --------
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp8",
      "video/webm",
    ];

    const chosenMimeType = candidates.find((t) => MediaRecorder.isTypeSupported(t));
    if (!chosenMimeType) throw new Error("No supported MediaRecorder mimeType found");

    log(`[RECORDER] Selected mimeType: ${chosenMimeType}`);

    // Create MediaRecorder
    mediaRecorder = new MediaRecorder(recordStream, {
      mimeType: chosenMimeType,
      videoBitsPerSecond: 2_500_000,
    });

    // IMPORTANT DEBUG: log every data event, even size=0
    mediaRecorder.ondataavailable = (event) => {
      const size = event.data?.size || 0;
      log(`[RECORDER] ondataavailable fired size=${size}`);
      if (event.data && size > 0) {
        recordedChunks.push(event.data);
        if (recordedChunks.length % 5 === 0) {
          log(`[RECORDER] ✅ Chunk ${recordedChunks.length}: ${size} bytes`);
        }
      }
    };

    mediaRecorder.onstop = () => {
      log("[UPLOAD TRIGGER] MediaRecorder.onstop fired!");
      log(`[UPLOAD TRIGGER] Total chunks: ${recordedChunks.length}`);

      // Stop render loop
      recording.value = false;

      // Stop canvas track
      try {
        canvasStream.getTracks().forEach((t) => t.stop());
      } catch { }

      // Cleanup audio context
      try {
        audioContext.close();
      } catch { }

      clearInterval(recordingTimer);

      setTimeout(async () => {
        log("[UPLOAD TRIGGER] Starting upload process...");
        await uploadRecording();
      }, 100);
    };

    mediaRecorder.onerror = (event: any) => {
      log(`[ERROR] MediaRecorder error: ${event?.error?.message || event?.error || "unknown"}`);
    };

    mediaRecorder.onstart = () => {
      log("[RECORDER] MediaRecorder started successfully");
    };

    // ✅ Start recorder with timeslice for guaranteed chunks
    mediaRecorder.start(1000);

    log(`[RECORDER] Recording started, state: ${mediaRecorder.state}`);

    recordingDuration.value = 0;
    recordingTimer = setInterval(() => {
      recordingDuration.value++;
    }, 1000);

    log(`✅ Recording started (${audioSourceCount} audio tracks, layout will adapt dynamically)`);

    socket?.emit("recording-started", { roomId: roomId.value });
  } catch (err: any) {
    log(`[ERROR] Recording failed: ${err?.message || err}`);
    recording.value = false;
  }
}


function confirmStopRecording() {
  showStopRecordingModal.value = true;
}

function stopRecording() {
  showStopRecordingModal.value = false;

  log("[STOP] stopRecording() called");
  log(`[STOP] mediaRecorder exists: ${!!mediaRecorder}`);
  log(`[STOP] recording.value: ${recording.value}`);

  if (mediaRecorder && recording.value) {
    log(`[STOP] MediaRecorder state: ${mediaRecorder.state}`);
    log(`[STOP] Chunks collected so far: ${recordedChunks.length}`);

    if (
      mediaRecorder.state === "recording" ||
      mediaRecorder.state === "paused"
    ) {
      try {
        log("[STOP] Calling mediaRecorder.stop()...");
        mediaRecorder.stop();
        log("[STOP] mediaRecorder.stop() executed successfully");
        log(`[STOP] MediaRecorder state after stop(): ${mediaRecorder.state}`);
      } catch (err: any) {
        log(`[ERROR] Error calling stop(): ${err.message}`);
        console.error("[ERROR] Stop error:", err);
      }
    } else {
      log(
        `[ERROR] MediaRecorder not in recording/paused state: ${mediaRecorder.state}`,
      );
    }

    // DON'T set recording.value = false here - let upload complete first

    // Show uploading modal
    showUploadingModal.value = true;
    uploadProgress.value = 0;

    // Notify all participants
    socket?.emit("recording-stopped", { roomId: roomId.value });

    // Enhanced fallback with more aggressive timeout
    setTimeout(() => {
      log("[FALLBACK] Checking if upload triggered...");
      log(`[FALLBACK] showUploadingModal: ${showUploadingModal.value}`);
      log(`[FALLBACK] uploadProgress: ${uploadProgress.value}`);
      log(`[FALLBACK] recordedChunks.length: ${recordedChunks.length}`);

      if (showUploadingModal.value && uploadProgress.value === 0) {
        log("[FALLBACK] onstop didn't fire! Manually triggering upload");
        uploadRecording();
      } else {
        log("[FALLBACK] Upload already triggered, no fallback needed");
      }
    }, 2000);

    // Super aggressive fallback if first one fails
    setTimeout(() => {
      if (
        showUploadingModal.value &&
        uploadProgress.value === 0 &&
        recordedChunks.length > 0
      ) {
        log("[FALLBACK-2] Second fallback triggered!");
        uploadRecording();
      }
    }, 5000);
  } else {
    log(
      `[ERROR] Cannot stop - mediaRecorder: ${!!mediaRecorder}, recording: ${recording.value}`,
    );
  }
}

async function uploadRecording() {
  log("[UPLOAD] uploadRecording() called");
  log(`[UPLOAD] recordedChunks.length: ${recordedChunks.length}`);

  if (recordedChunks.length === 0) {
    log("[ERROR] No recording data to upload!");
    showUploadingModal.value = false;
    recording.value = false; // Reset recording state
    return;
  }

  try {
    log("[UPLOAD] Creating blob from chunks...");
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    log(
      `[UPLOAD] Blob created, size: ${blob.size} bytes (${(blob.size / 1024 / 1024).toFixed(2)} MB)`,
    );

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `room-${roomId.value}-${timestamp}.webm`;

    uploadedFileName.value = filename;

    log("[UPLOAD] Creating FormData...");
    const formData = new FormData();
    formData.append("recording", blob, filename);
    formData.append("roomId", String(roomId.value));
    formData.append("timestamp", new Date().toISOString());
    log(`[UPLOAD] FormData created - roomId: ${roomId.value}, filename: ${filename}`);

    log(
      `[UPLOAD] Starting fetch to ${socketUrl}/api/upload-recording`,
    );

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10;
        log(`[UPLOAD] Progress: ${uploadProgress.value}%`);
      }
    }, 200);

    const response = await fetch(`${socketUrl}/api/upload-recording`, {
      method: "POST",
      body: formData,
    });

    clearInterval(progressInterval);
    uploadProgress.value = 100;

    log(`[UPLOAD] Response status: ${response.status}`);
    log(
      `[UPLOAD] Response headers: ${JSON.stringify([...response.headers.entries()])}`,
    );

    const result = await response.json();
    log(`[UPLOAD] Response body: ${JSON.stringify(result)}`);

    if (result.success) {
      log(`[SUCCESS] ✅ Recording saved: ${result.filename}`);
      log(`[SUCCESS] 📹 URL: ${result.url}`);

      // NOW we can safely set recording to false
      recording.value = false;

      // Show success modal
      uploadedFileUrl.value = result.url;
      uploadedFileName.value = result.filename;
      showUploadingModal.value = false;
      showUploadSuccessModal.value = true;
    } else {
      log(`[ERROR] ❌ Upload failed: ${result.error}`);

      // Reset recording state
      recording.value = false;

      // Show error modal
      uploadError.value = result.error || "Unknown error";
      showUploadingModal.value = false;
      showUploadErrorModal.value = true;
    }

    // Don't clear chunks yet (in case of retry or download)
  } catch (err: any) {
    log(`[ERROR] Upload exception: ${err?.message || err}`);
    console.error("[ERROR] Upload error details:", err);

    // Reset recording state
    recording.value = false;

    // Show error modal
    uploadError.value = err?.message || err || "Network error";
    showUploadingModal.value = false;
    showUploadErrorModal.value = true;
  }
}

function copyRecordingLink() {
  navigator.clipboard.writeText(uploadedFileUrl.value);
  log("Link copied to clipboard");
}

function closeUploadSuccessModal() {
  showUploadSuccessModal.value = false;
  recordedChunks = [];
}

function startAnotherRecording() {
  showUploadSuccessModal.value = false;
  recordedChunks = [];
  // Auto start if screen share is active
  if (sharing.value) {
    startRecording();
  }
}

function retryUpload() {
  showUploadErrorModal.value = false;
  showUploadingModal.value = true;
  uploadProgress.value = 0;
  uploadRecording();
}

function downloadRecording() {
  if (recordedChunks.length === 0) return;

  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = uploadedFileName.value || `recording-${Date.now()}.webm`;
  a.click();
  URL.revokeObjectURL(url);

  log("Recording downloaded");
  showUploadErrorModal.value = false;
  recordedChunks = [];
}

function discardRecording() {
  showUploadErrorModal.value = false;
  recordedChunks = [];
  log("Recording discarded");
}

// ============= AUDIO DETECTION FUNCTIONS =============

function setupAudioDetection(stream: MediaStream, peerId: string) {
  try {
    log(`[AUDIO DETECTION] Starting setup for ${peerId === socket?.id ? 'local (You)' : peerId}`);
    log(`[AUDIO DETECTION] Stream tracks: ${stream.getTracks().map(t => t.kind).join(', ')}`);
    
    const audioTracks = stream.getAudioTracks();
    log(`[AUDIO DETECTION] Audio tracks count: ${audioTracks.length}`);
    
    if (audioTracks.length === 0) {
      log(`[AUDIO DETECTION] ❌ No audio tracks found for ${peerId}`);
      return;
    }

    const audioTrack = audioTracks[0];
    log(`[AUDIO DETECTION] Audio track state: enabled=${audioTrack.enabled}, muted=${audioTrack.muted}, readyState=${audioTrack.readyState}`);
    
    const audioContext = new AudioContext();
    log(`[AUDIO DETECTION] AudioContext created, state: ${audioContext.state}`);
    
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    log(`[AUDIO DETECTION] Analyser configured: fftSize=${analyser.fftSize}, frequencyBinCount=${analyser.frequencyBinCount}`);

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    log(`[AUDIO DETECTION] Source connected to analyser`);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const threshold = 30; // Audio threshold (adjust as needed)
    
    let frameCount = 0;
    let lastLogTime = Date.now();

    const detectAudio = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      
      frameCount++;
      
      // Log every 60 frames (about 1 second) or when speaking state changes
      const now = Date.now();
      const shouldLog = (now - lastLogTime) > 1000;
      
      if (shouldLog) {
        log(`[AUDIO DETECTION] ${peerId === socket?.id ? 'YOU' : peerId.substring(0, 8)}: level=${average.toFixed(2)}, threshold=${threshold}, mic=${micEnabled.value ? 'ON' : 'OFF'}`);
        lastLogTime = now;
      }
      
      const speaking = average > threshold;
      
      // Update speaking state
      if (isSpeaking.value[peerId] !== speaking) {
        log(`[AUDIO DETECTION] 🔊 ${peerId === socket?.id ? 'YOU' : peerId.substring(0, 8)} ${speaking ? 'STARTED' : 'STOPPED'} speaking (level: ${average.toFixed(2)})`);
        isSpeaking.value[peerId] = speaking;
        
        // Broadcast speaking state to others
        if (peerId === socket?.id) {
          log(`[AUDIO DETECTION] Broadcasting speaking status: ${speaking}`);
          socket?.emit("speaking-status", {
            roomId: roomId.value,
            speaking,
          });
          
          // Show warning if speaking but mic is off
          if (speaking && !micEnabled.value) {
            log(`[AUDIO DETECTION] ⚠️ Speaking detected but mic is OFF - showing warning`);
            showMicWarning.value = true;
            // Auto hide after 5 seconds
            setTimeout(() => {
              showMicWarning.value = false;
            }, 5000);
          }
        }
      }
      
      requestAnimationFrame(detectAudio);
    };

    detectAudio();
    
    log(`[AUDIO DETECTION] ✅ Setup complete and running for ${peerId === socket?.id ? 'local' : peerId}`);
  } catch (err: any) {
    log(`[AUDIO DETECTION] ❌ Error for ${peerId}: ${err.message}`);
    console.error('[AUDIO DETECTION] Full error:', err);
  }
}

function startLocalAudioDetection() {
  log(`[AUDIO DETECTION] startLocalAudioDetection() called`);
  log(`[AUDIO DETECTION] localCameraStream exists: ${!!localCameraStream}`);
  log(`[AUDIO DETECTION] socket.id: ${socket?.id}`);
  
  if (!localCameraStream) {
    log(`[AUDIO DETECTION] ❌ No localCameraStream`);
    return;
  }
  
  const audioTracks = localCameraStream.getAudioTracks();
  log(`[AUDIO DETECTION] Local audio tracks: ${audioTracks.length}`);
  
  if (audioTracks.length > 0 && socket?.id) {
    log(`[AUDIO DETECTION] Creating audio stream for local detection...`);
    const audioStream = new MediaStream([audioTracks[0]]);
    setupAudioDetection(audioStream, socket.id);
  } else {
    log(`[AUDIO DETECTION] ❌ Cannot start: audioTracks=${audioTracks.length}, socketId=${socket?.id}`);
  }
}

function setupRemoteAudioDetection(peerId: string, stream: MediaStream) {
  log(`[AUDIO DETECTION] setupRemoteAudioDetection() called for ${peerId}`);
  const audioTracks = stream.getAudioTracks();
  log(`[AUDIO DETECTION] Remote ${peerId} audio tracks: ${audioTracks.length}`);
  
  if (audioTracks.length > 0) {
    log(`[AUDIO DETECTION] Setting up detection for remote peer ${peerId}...`);
    setupAudioDetection(stream, peerId);
  } else {
    log(`[AUDIO DETECTION] ⚠️ No audio tracks for remote peer ${peerId}`);
  }
}

onBeforeUnmount(() => {
  if (recordingTimer) {
    clearInterval(recordingTimer);
  }
  if (audioDetectionInterval) {
    clearInterval(audioDetectionInterval);
  }
  if (recording.value) {
    stopRecording();
  }
  stopSharing();

  // Stop camera/mic
  if (localCameraStream) {
    localCameraStream.getTracks().forEach((t) => t.stop());
    localCameraStream = null;
  }

  // Close all peer connections
  for (const pc of Object.values(peerConnections)) {
    pc.close();
  }
  peerConnections = {};

  socket?.disconnect();
  socket = null;
});
</script>
