<template>
  <div class="p-4 w-full">
    <div class="grid grid-cols-12 gap-4">
      <!-- start layout for room id and timer -->
      <div class="col-span-12 font-bold border-line text-center p-2">
        Room ID: {{ route.params.id }}
      </div>
      <!-- end layout for room id and timer -->
      <!--  -->
      <div class="col-span-9 border-line">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-6 border-line aspect-video">1</div>
          <div class="col-span-6 border-line aspect-video">2</div>
          <div class="col-span-6 border-line aspect-video">3</div>
          <div class="col-span-6 border-line aspect-video">4</div>
        </div>
      </div>
      <div v-if="isShowChat" class="col-span-3 border-line h-full">
        ini untuk peserta/chat
      </div>
      <!-- start layout for meeting buttons (mix, video, share screen, chat, end {disconnected}) -->
      <div class="col-span-12 font-bold border-line text-center p-2">
        <div
          class="flex items-center justify-center gap-3 p-2 bg-white dark:bg-surface-dark rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 dark:border-slate-700 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95"
        >
          <!-- MIC -->
          <button
            class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            :title="isMuted ? 'Unmute' : 'Mute'"
            @click="handleMic"
          >
            <UIcon
              :name="
                isMuted
                  ? 'material-symbols:mic-off-rounded'
                  : 'material-symbols:mic-rounded'
              "
              class="size-6 pointer-events-none"
            />
            <span
              class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
            >
              {{ isMuted ? "Unmute" : "Mute" }}
            </span>
          </button>

          <!-- CAMERA -->
          <button
            class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            :title="isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'"
            @click="handleVideo"
          >
            <UIcon
              :name="
                isVideoOff
                  ? 'material-symbols:videocam-off-rounded'
                  : 'material-symbols:videocam-rounded'
              "
              class="size-6 pointer-events-none"
            />
            <span
              class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
            >
              {{ isVideoOff ? "Turn On Camera" : "Turn Off Camera" }}
            </span>
          </button>

          <div class="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

          <!-- SHARE SCREEN -->
          <button
            class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-all"
            title="Share Screen"
            @click="handleShareScreen"
          >
            <UIcon
              name="material-symbols:present-to-all-rounded"
              class="size-6 pointer-events-none"
            />
            <span
              class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
            >
              Share Screen
            </span>
          </button>

          <!-- RECORD -->
          <!-- <button
            class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            :title="isRecording ? 'Stop Recording' : 'Record'"
            @click="handleRecording"
          >
            <UIcon
              :name="
                isRecording
                  ? 'material-symbols:stop-circle-rounded'
                  : 'material-symbols:radio-button-checked-rounded'
              "
              class="size-6 pointer-events-none"
              :class="isRecording ? 'text-danger' : ''"
            />
            <span
              class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
            >
              {{ isRecording ? "Stop Recording" : "Record" }}
            </span>
          </button> -->

          <div class="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
          <!-- CHAT -->
          <button
            class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            title="Show Chat"
            @click="toggleChat"
          >
            <UIcon
              name="material-symbols:chat-bubble-rounded"
              class="size-6 pointer-events-none"
            />
            <span
              v-if="hasUnreadMessage"
              class="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-surface-dark"
            ></span>
            <span
              class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
            >
              Chat
            </span>
          </button>
          <!-- END CALL -->
          <button
            class="group relative w-16 h-12 rounded-full flex items-center justify-center bg-danger text-white bg-red-600 shadow-md shadow-red-200 dark:shadow-none transition-all"
            title="End Call"
            @click="handleEndCall"
          >
            <UIcon
              name="material-symbols:call-end"
              class="size-6"
            />
            <span
              class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
            >
              End Call
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const participants = ref<string[]>([]);

const isMuted = ref(false);
const isVideoOff = ref(false);
const isScreenSharing = ref(false);
const isShowChat = ref(false);
const isRecording = ref(false);
const hasUnreadMessage = ref(true);

const toggleChat = () => {
  isShowChat.value = !isShowChat.value;
  if (isShowChat.value) {
    hasUnreadMessage.value = false;
  }
};

const handleShareScreen = () => {
  console.log("share screen clicked");
  isScreenSharing.value = !isScreenSharing.value;
};

const handleRecording = () => {
  console.log("recording clicked");
  isRecording.value = !isRecording.value;
};

const handleEndCall = () => {
  console.log("end call clicked");
};

const handleMic = () => {
  console.log("mic clicked");
  isMuted.value = !isMuted.value;
};

const handleVideo = () => {
  console.log("video clicked");
  isVideoOff.value = !isVideoOff.value;
};

const dynamicGridClass = computed(() => {
  const count = participants.value.length;
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  if (count <= 6) return "grid-cols-3";
  if (count <= 9) return "grid-cols-3";
  return "grid-cols-4";
});
</script>

<style scoped></style>
