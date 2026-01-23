<template>
  <div>
    <ClientOnly>
      <body
        class="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 h-screen w-screen overflow-hidden flex flex-col"
      >
        <!-- Top Header Bar -->
        <header
          class="h-16 flex-none flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark z-20"
        >
          <!-- Room Info -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 text-slate-800 dark:text-white">
              <UIcon name="material-symbols:videocam" class="text-primary" />
              <h2 class="text-lg font-bold tracking-tight">
                {{ store.roomName }}
              </h2>
            </div>
            <div class="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
            <button
              @click="store.setTabActive('participants')"
              class="cursor-pointer flex items-center gap-2 px-3 py-1 rounded-full bg-surface-light dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-200"
            >
              <UIcon
                name="material-symbols:group"
                class="text-slate-500 text-[18px]"
              />
              <span
                class="text-sm font-medium text-slate-600 dark:text-slate-300"
                >{{ store.participantCount }} Participant{{
                  store.participantCount !== 1 ? "s" : ""
                }}</span
              >
            </button>
            <!-- Timer -->
            <div
              class="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-danger border border-red-100 dark:border-red-900/30"
            >
              <span class="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
              <p class="font-mono text-sm font-medium tabular-nums">00:15:42</p>
            </div>
          </div>
          <!-- Right Actions -->
          <div class="flex items-center gap-3">
            <button
              class="flex items-center justify-center h-9 px-4 rounded-full bg-primary text-white text-sm font-bold hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm shadow-blue-200 dark:shadow-none"
            >
              <UIcon
                name="material-symbols:person-add"
                class="text-[18px] mr-2"
              />
              Invite
            </button>
            <button
              class="flex items-center justify-center w-9 h-9 rounded-full bg-surface-light dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:rotate-90 transition-all duration-300"
            >
              <UIcon name="material-symbols:settings" class="text-[20px]" />
            </button>
          </div>
        </header>

        <!-- Main Content Area -->
        <main class="flex-1 flex overflow-hidden relative">
          <!-- Video Grid / Screen Share (75%) -->
          <div
            class="flex-1 p-4 flex flex-col items-center justify-center bg-surface-light dark:bg-background-dark relative"
          >
            <!-- Screen Sharing Mode -->
            <transition
              mode="out-in"
              enter-active-class="transition-all duration-400 ease-out"
              leave-active-class="transition-all duration-400 ease-in"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <ScreenShareViewer
                v-if="store.isScreenSharing"
                key="screen-share"
                :screen-stream="screenShareStream"
                :sharer-name="screenSharerName"
              />
              <ParticipantGrid
                v-else
                key="grid"
                :participants="store.participants"
                :grid-class="store.gridClass"
                :local-stream="webrtc?.localStream || null"
                :remote-streams="webrtc?.remoteStreams || new Map()"
              />
            </transition>

            <!-- Floating Bottom Control Bar -->
            <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
              <div
                class="flex items-center gap-3 p-2 bg-white/60 dark:bg-surface-dark rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 dark:border-slate-700 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95"
              >
                <button
                  @click="handleToggleMic"
                  class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all duration-200"
                  :title="
                    store.isMuted ? 'Unmute Microphone' : 'Mute Microphone'
                  "
                >
                  <transition
                    mode="out-in"
                    enter-active-class="transition-all duration-150"
                    leave-active-class="transition-all duration-150"
                    enter-from-class="scale-0 rotate-180"
                    enter-to-class="scale-100 rotate-0"
                    leave-from-class="scale-100 rotate-0"
                    leave-to-class="scale-0 -rotate-180"
                  >
                    <UIcon
                      :key="store.isMuted ? 'muted' : 'unmuted'"
                      :name="
                        store.isMuted
                          ? 'material-symbols:mic-off'
                          : 'material-symbols:mic'
                      "
                      class="size-6"
                    />
                  </transition>
                  <span
                    class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                  >
                    {{ store.isMuted ? "Unmute" : "Mute" }}
                  </span>
                </button>
                <button
                  @click="handleToggleVideo"
                  class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all duration-200"
                  :title="
                    store.isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'
                  "
                >
                  <transition
                    mode="out-in"
                    enter-active-class="transition-all duration-150"
                    leave-active-class="transition-all duration-150"
                    enter-from-class="scale-0 rotate-180"
                    enter-to-class="scale-100 rotate-0"
                    leave-from-class="scale-100 rotate-0"
                    leave-to-class="scale-0 -rotate-180"
                  >
                    <UIcon
                      :key="store.isVideoOff ? 'off' : 'on'"
                      :name="
                        store.isVideoOff
                          ? 'material-symbols:videocam-off'
                          : 'material-symbols:videocam'
                      "
                      class="size-6"
                    />
                  </transition>
                </button>
                <div class="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                <button
                  @click="handleToggleScreenShare"
                  :disabled="isSomeoneElseSharing"
                  class="group relative w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  :class="
                    store.isScreenSharing && !isSomeoneElseSharing
                      ? 'bg-red-100 text-red-500 hover:bg-red-200'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  "
                  :title="
                    isSomeoneElseSharing
                      ? 'Someone else is sharing'
                      : store.isScreenSharing
                        ? 'Stop Sharing'
                        : 'Share Screen'
                  "
                >
                  <transition
                    mode="out-in"
                    enter-active-class="transition-all duration-150"
                    leave-active-class="transition-all duration-150"
                    enter-from-class="scale-0 rotate-180"
                    enter-to-class="scale-100 rotate-0"
                    leave-from-class="scale-100 rotate-0"
                    leave-to-class="scale-0 -rotate-180"
                  >
                    <UIcon
                      :key="store.isScreenSharing ? 'stop' : 'start'"
                      :name="
                        store.isScreenSharing && !isSomeoneElseSharing
                          ? 'material-symbols:cancel-presentation'
                          : 'material-symbols:present-to-all'
                      "
                      class="size-6"
                    />
                  </transition>
                </button>
                <button
                  @click="store.toggleRecording()"
                  class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all duration-200"
                  :title="store.isRecording ? 'Stop Recording' : 'Record'"
                >
                  <UIcon
                    name="material-symbols:radio-button-checked"
                    class="size-6"
                    :class="
                      store.isRecording
                        ? 'text-red-500'
                        : 'text-slate-700 dark:text-slate-200'
                    "
                  />
                </button>
                <button
                  @click="store.setTabActive('chat')"
                  class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all duration-200"
                  :title="
                    store.tabActive === 'chat' && store.showSidePanel
                      ? 'Hide Chat'
                      : 'Show Chat'
                  "
                >
                  <UIcon
                    :name="
                      store.tabActive === 'chat' && store.showSidePanel
                        ? 'material-symbols:chat-bubble-outline'
                        : 'material-symbols:chat-bubble'
                    "
                    class="size-6"
                  />
                  <transition
                    enter-active-class="transition-all duration-200"
                    leave-active-class="transition-all duration-200"
                    enter-from-class="scale-0 opacity-0"
                    enter-to-class="scale-100 opacity-100"
                    leave-from-class="scale-100 opacity-100"
                    leave-to-class="scale-0 opacity-0"
                  >
                    <span
                      v-if="store.hasUnreadMessage"
                      class="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-surface-dark"
                    ></span>
                  </transition>
                </button>
                <div class="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                <button
                  @click="handleLeave"
                  class="w-16 h-12 rounded-full flex items-center justify-center bg-danger text-white bg-red-500 hover:bg-red-700 hover:scale-110 active:scale-95 shadow-md shadow-red-200 dark:shadow-none transition-all duration-200"
                  title="End Call"
                >
                  <UIcon name="material-symbols:call-end" class="size-6" />
                </button>
              </div>
            </div>
          </div>

          <!-- Sidebar (25%) -->
          <transition
            enter-active-class="transition-all duration-300 ease-out"
            leave-active-class="transition-all duration-300 ease-in"
            enter-from-class="translate-x-full opacity-0"
            enter-to-class="translate-x-0 opacity-100"
            leave-from-class="translate-x-0 opacity-100"
            leave-to-class="translate-x-full opacity-0"
          >
            <aside
              v-if="store.showSidePanel || store.isScreenSharing"
              class="w-[320px] xl:w-90 bg-white dark:bg-surface-dark border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 shrink-0"
            >
              <!-- Screen Sharing Mode: Video Thumbnails -->
              <template v-if="store.isScreenSharing">
                <div
                  class="p-4 border-b border-slate-100 dark:border-slate-800"
                >
                  <h3
                    class="text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    Participants ({{ store.participantCount }})
                  </h3>
                </div>
                <ParticipantThumbnails
                  :participants="store.participants"
                  :local-stream="webrtc?.localStream || null"
                  :remote-streams="webrtc?.remoteStreams || new Map()"
                />
              </template>

              <!-- Normal Mode: Tabs (Chat/Participants) -->
              <template v-else>
                <!-- Tabs -->
                <div
                  class="flex items-center p-4 border-b border-slate-100 dark:border-slate-800"
                >
                  <button
                    @click="store.setTabActive('participants')"
                    class="flex-1 pb-3 text-sm font-semibold transition-colors border-b-2"
                    :class="
                      store.tabActive === 'participants'
                        ? 'text-primary border-primary'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-transparent'
                    "
                  >
                    Participants ({{ store.participantCount }})
                  </button>
                  <button
                    @click="store.setTabActive('chat')"
                    class="flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 relative"
                    :class="
                      store.tabActive === 'chat'
                        ? 'text-primary border-primary'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-transparent'
                    "
                  >
                    Chat
                    <transition
                      enter-active-class="transition-all duration-200"
                      leave-active-class="transition-all duration-200"
                      enter-from-class="scale-0 opacity-0"
                      enter-to-class="scale-100 opacity-100"
                      leave-from-class="scale-100 opacity-100"
                      leave-to-class="scale-0 opacity-0"
                    >
                      <span
                        v-if="
                          store.hasUnreadMessage && store.tabActive !== 'chat'
                        "
                        class="absolute top-0 right-8 w-2 h-2 bg-red-500 rounded-full"
                      ></span>
                    </transition>
                  </button>
                </div>
                <transition
                  mode="out-in"
                  enter-active-class="transition-all duration-200 ease-out"
                  leave-active-class="transition-all duration-200 ease-in"
                  enter-from-class="opacity-0 translate-x-4"
                  enter-to-class="opacity-100 translate-x-0"
                  leave-from-class="opacity-100 translate-x-0"
                  leave-to-class="opacity-0 -translate-x-4"
                >
                  <!-- Tab Content -->
                  <div class="flex-1 overflow-hidden relative">
                    <div
                      v-show="store.tabActive === 'participants'"
                      class="h-full"
                    >
                      <ParticipantList
                        :participants="store.participants"
                        :is-host="isHost"
                        :is-co-host="isCoHost"
                        :on-kick="handleKickParticipant"
                        :on-assign-co-host="handleAssignCoHost"
                        :on-remove-co-host="handleRemoveCoHost"
                        :on-rename="handleRenameUser"
                      />
                    </div>
                    <div v-show="store.tabActive === 'chat'" class="h-full">
                      <ChatPanel
                        :messages="store.messages"
                        :participants="store.participants"
                        :current-user-id="currentUserId"
                        @send-message="handleSendMessage"
                      />
                    </div>
                  </div>
                </transition>
              </template>
            </aside>
          </transition>
        </main>

        <!-- Debug Console (Collapsible) -->
        <!-- <div
          class="bg-[#1E1E1E] border-t border-slate-800 text-[#f8f8f2] font-mono text-xs flex flex-col transition-all duration-300 group/console hover:h-48 h-8 z-50 overflow-hidden absolute bottom-0 w-full shadow-2xl"
        >
          <div
            class="flex items-center justify-between px-4 py-1.5 bg-[#282a36] cursor-pointer select-none"
          >
            <div class="flex items-center gap-2">
              <UIcon
                name="material-symbols:terminal"
                class="text-[14px] text-slate-400"
              />
              <span class="font-semibold text-slate-400">Debug Console</span>
            </div>
            <UIcon
              name="material-symbols:expand-less"
              class="text-[16px] text-slate-500 group-hover/console:rotate-180 transition-transform"
            />
          </div>
          <div class="p-4 overflow-y-auto flex flex-col gap-1 h-full">
            <div class="flex gap-3">
              <span class="text-slate-500">[15:42:01]</span>
              <span class="text-[#50FA7B]"
                >Connection established:
                wss://signaling.webrtc.app/v1/rooms/room-1</span
              >
            </div>
            <div class="flex gap-3">
              <span class="text-slate-500">[15:42:02]</span>
              <span class="text-[#8BE9FD]"
                >ICE candidate found: 192.168.1.105:54322 (udp)</span
              >
            </div>
            <div class="flex gap-3">
              <span class="text-slate-500">[15:42:02]</span>
              <span class="text-[#8BE9FD]"
                >ICE candidate found: 203.0.113.42:60001 (tcp)</span
              >
            </div>
            <div class="flex gap-3">
              <span class="text-slate-500">[15:42:03]</span>
              <span class="text-[#FFB86C]"
                >MediaStreamTrack: Video track enabled (1280x720@30fps)</span
              >
            </div>
            <div class="flex gap-3">
              <span class="text-slate-500">[15:42:05]</span>
              <span class="text-[#BD93F9]"
                >PeerConnection: stable state reached for peer-bob-smith</span
              >
            </div>
          </div>
        </div> -->
      </body>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ChatPanel from "~/components/views/ChatPanel.vue";
import ParticipantGrid from "~/components/views/ParticipantGrid.vue";
import ParticipantList from "~/components/views/ParticipantList.vue";
import ParticipantThumbnails from "~/components/views/ParticipantThumbnails.vue";
import ScreenShareViewer from "~/components/views/ScreenShareViewer.vue";
import { useMeetingStore } from "~/stores/meeting";
import { useWebRTC } from "~/composables/useWebRTC";

const route = useRoute();
const router = useRouter();
const store = useMeetingStore();
const toast = useAppToast();

// Get room ID from route
const roomId = computed(() => route.params.id as string);
const username = computed(() => {
  // Try to get from store first
  if (store.username) return store.username;

  // Fallback to query param
  const nameFromQuery = route.query.username as string;
  if (nameFromQuery) return nameFromQuery;

  // Fallback to localStorage
  const nameFromStorage = localStorage.getItem("username");
  if (nameFromStorage) return nameFromStorage;

  return "";
});

// Initialize WebRTC
const webrtc = ref<ReturnType<typeof useWebRTC> | null>(null);

onMounted(() => {
  console.log("[PAGE] onMounted called");
  console.log("[PAGE] roomId:", roomId.value);
  console.log("[PAGE] username:", username.value);

  // Validate username
  if (!username.value) {
    console.error("[PAGE] No username provided, redirecting to home");
    router.push("/");
    return;
  }

  // Initialize WebRTC only on client
  if (process.client) {
    console.log("[PAGE] Initializing WebRTC...");

    // Create onToast callback
    const onToast = (
      type: "success" | "error" | "info" | "warn",
      title: string,
      description?: string,
    ) => {
      toast[type](title, description);
    };

    webrtc.value = useWebRTC(roomId.value, username.value, onToast);
  }
});

// Get current user ID
const currentUserId = computed(() => {
  const you = store.participants.find((p) => p.isYou);
  return you?.id || "";
});

// Check if current user is host
const isHost = computed(() => {
  if (!webrtc.value) return false;
  return webrtc.value.hostSocketId?.value === currentUserId.value;
});

// Check if current user is co-host
const isCoHost = computed(() => {
  if (!webrtc.value) return false;
  return (
    webrtc.value.coHostSocketIds?.value?.includes(currentUserId.value) || false
  );
});

// Check if someone else is sharing (not me)
const isSomeoneElseSharing = computed(() => {
  if (!store.isScreenSharing) return false;

  // Check if we are the one sharing
  const you = store.participants.find((p) => p.isYou);
  if (!you) return false;

  // If we have local screen stream, we are sharing
  const localScreen = webrtc.value?.getLocalScreenStream();
  if (localScreen) return false;

  // Someone else is sharing
  return true;
});

// Action functions
const handleKickParticipant = (socketId: string) => {
  if (webrtc.value && (isHost.value || isCoHost.value)) {
    webrtc.value.kickParticipant(socketId);
    toast.warn("Participant Kicked", "User has been removed from the call");
  }
};

const handleAssignCoHost = (socketId: string) => {
  if (webrtc.value && isHost.value) {
    webrtc.value.assignCoHost(socketId);
    toast.success("Co-host Assigned", "User is now a co-host");
  }
};

const handleRemoveCoHost = (socketId: string) => {
  if (webrtc.value && isHost.value) {
    webrtc.value.removeCoHostRole(socketId);
    toast.info("Co-host Removed", "User is no longer a co-host");
  }
};

const handleRenameUser = (newUsername: string) => {
  if (webrtc.value && newUsername.trim()) {
    webrtc.value.renameCurrentUser(newUsername);
    toast.success("Name Changed", `You are now ${newUsername}`);
  }
};

// Handle leave meeting
const handleLeave = () => {
  if (webrtc.value) {
    webrtc.value.leaveMeeting();
  }
  router.push("/");
};

// Override store actions to use WebRTC
const handleToggleMic = () => {
  if (webrtc.value) {
    webrtc.value.toggleMic();
  }
};

const handleToggleVideo = () => {
  if (webrtc.value) {
    webrtc.value.toggleVideo();
  }
};

const handleToggleScreenShare = () => {
  if (webrtc.value) {
    webrtc.value.toggleScreenShare();
  }
};

const handleSendMessage = (message: string) => {
  if (webrtc.value) {
    webrtc.value.sendMessage(message);
  }
};

// Get screen share stream (could be from local or remote) - COMPUTED for reactivity
const screenShareStream = computed(() => {
  console.log("[Page] screenShareStream computed triggered");

  if (!webrtc.value) {
    console.log("[Page] No webrtc instance");
    return null;
  }

  // Check if we're sharing - use localScreenStream (separate from camera)
  const you = store.participants.find((p) => p.isYou);
  if (you && store.isScreenSharing) {
    const localScreen = webrtc.value.getLocalScreenStream();
    console.log("[Page] We are sharing, localScreen:", !!localScreen);
    if (localScreen) {
      console.log(
        "[Page] Using local screen stream with",
        localScreen.getTracks().length,
        "tracks",
      );
      return localScreen;
    }
  }

  // Someone else is sharing - check screenShareStreams first
  console.log(
    "[Page] Checking screenShareStreams, size:",
    webrtc.value.screenShareStreams?.size || 0,
  );
  if (
    webrtc.value.screenShareStreams &&
    webrtc.value.screenShareStreams.size > 0
  ) {
    for (const [socketId, stream] of webrtc.value.screenShareStreams) {
      console.log(
        "[Page] Found screen share stream from:",
        socketId,
        "with",
        stream.getTracks().length,
        "tracks",
      );
      return stream;
    }
  }

  console.log("[Page] No screen share stream found, returning null");
  return null;
});

// Get screen sharer name - COMPUTED for reactivity
const screenSharerName = computed(() => {
  if (!webrtc.value) {
    console.log("[Page] screenSharerName: No webrtc instance");
    return "Unknown";
  }

  // Check localScreenStream first - if we have it, we're sharing
  const localScreen = webrtc.value.getLocalScreenStream();
  if (localScreen) {
    const you = store.participants.find((p) => p.isYou);
    console.log("[Page] screenSharerName: We are sharing as", you?.name);
    return you?.name || "You";
  }

  // Check whoIsSharing directly from webrtc
  const whoIsSharing = webrtc.value.whoIsSharing?.value;
  console.log("[Page] screenSharerName: whoIsSharing =", whoIsSharing);

  if (whoIsSharing) {
    const sharer = store.participants.find((p) => p.id === whoIsSharing);
    if (sharer) {
      console.log("[Page] screenSharerName: Found sharer:", sharer.name);
      return sharer.name;
    }
  }

  // Fallback: Check screenShareStreams
  if (
    webrtc.value.screenShareStreams &&
    webrtc.value.screenShareStreams.size > 0
  ) {
    for (const [socketId] of webrtc.value.screenShareStreams) {
      const sharer = store.participants.find((p) => p.id === socketId);
      if (sharer) {
        console.log(
          "[Page] screenSharerName: Found from streams:",
          sharer.name,
        );
        return sharer.name;
      }
    }
  }

  console.log("[Page] screenSharerName: Returning Unknown");
  return "Unknown";
});
</script>

<style scoped></style>
