<template>
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
          <h2 class="text-lg font-bold tracking-tight">{{ store.roomName }}</h2>
        </div>
        <div class="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
        <button
          @click="store.setTabActive('participants')"
          class="cursor-pointer flex items-center gap-2 px-3 py-1 rounded-full bg-surface-light dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        >
          <UIcon
            name="material-symbols:group"
            class="text-slate-500 text-[18px]"
          />
          <span class="text-sm font-medium text-slate-600 dark:text-slate-300"
            >{{ store.participantCount }} Participant{{ store.participantCount !== 1 ? 's' : '' }}</span
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
          @click="store.addParticipant()"
          class="flex items-center justify-center h-9 px-4 rounded-full bg-primary text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 dark:shadow-none"
        >
          <UIcon name="material-symbols:person-add" class="text-[18px] mr-2" />
          Invite
        </button>
        <button
          class="flex items-center justify-center w-9 h-9 rounded-full bg-surface-light dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
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
        <template v-if="store.isScreenSharing">
          <div
            class="w-full h-full rounded-2xl overflow-hidden bg-slate-900 shadow-lg ring-4 ring-primary ring-offset-2 ring-offset-surface-light dark:ring-offset-background-dark transition-all duration-300 flex items-center justify-center"
          >
            <div class="text-center">
              <UIcon
                name="material-symbols:present-to-all"
                class="text-[64px] text-slate-600 mb-4"
              />
              <p class="text-white text-xl font-semibold">Screen Sharing Active</p>
              <p class="text-slate-400 text-sm mt-2">Shared by {{ store.activeSpeaker?.name }}</p>
            </div>
          </div>
        </template>

        <!-- Normal Grid Mode -->
        <template v-else>
          <ParticipantGrid
            :participants="store.participants"
            :grid-class="store.gridClass"
          />
        </template>

        <!-- Floating Bottom Control Bar -->
        <div class="absolute bottom-12 left-1/2 -translate-x-1/2 z-30">
          <div
            class="flex items-center gap-3 p-2 bg-white/60 dark:bg-surface-dark rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 dark:border-slate-700 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95"
          >
            <button
              @click="store.toggleMic()"
              class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              :title="store.isMuted ? 'Unmute Microphone' : 'Mute Microphone'"
            >
              <UIcon
                :name="
                  store.isMuted ? 'material-symbols:mic-off' : 'material-symbols:mic'
                "
                class="size-6"
              />
              <span
                class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
              >
                {{ store.isMuted ? "Unmute" : "Mute" }}
              </span>
            </button>
            <button
              @click="store.toggleVideo()"
              class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              :title="store.isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'"
            >
              <UIcon
                :name="
                  store.isVideoOff
                    ? 'material-symbols:videocam-off'
                    : 'material-symbols:videocam'
                "
                class="size-6"
              />
            </button>
            <div class="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
            <button
              @click="store.toggleScreenShare()"
              class="group relative w-12 h-12 rounded-full flex items-center justify-center transition-all"
              :class="
                store.isScreenSharing
                  ? 'bg-red-100 text-red-500 hover:bg-red-200'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              "
              :title="store.isScreenSharing ? 'Stop Sharing' : 'Share Screen'"
            >
              <UIcon
                :name="
                  store.isScreenSharing
                    ? 'material-symbols:cancel-presentation'
                    : 'material-symbols:present-to-all'
                "
                class="size-6"
              />
            </button>
            <button
              @click="store.toggleRecording()"
              class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
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
              class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
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
              <span
                v-if="store.hasUnreadMessage"
                class="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-surface-dark"
              ></span>
            </button>
            <div class="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
            <button
              class="w-16 h-12 rounded-full flex items-center justify-center bg-danger text-white bg-red-500 hover:bg-red-700 shadow-md shadow-red-200 dark:shadow-none transition-all"
              title="End Call"
            >
              <UIcon name="material-symbols:call-end" class="size-6" />
            </button>
          </div>
        </div>
      </div>

      <!-- Sidebar (25%) -->
      <aside
        v-if="store.showSidePanel || store.isScreenSharing"
        class="w-[320px] xl:w-90 bg-white dark:bg-surface-dark border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 shrink-0"
      >
        <!-- Screen Sharing Mode: Video Thumbnails -->
        <template v-if="store.isScreenSharing">
          <div class="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white">
              Participants ({{ store.participantCount }})
            </h3>
          </div>
          <ParticipantThumbnails :participants="store.participants" />
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
              <span
                v-if="store.hasUnreadMessage && store.tabActive !== 'chat'"
                class="absolute top-0 right-8 w-2 h-2 bg-red-500 rounded-full"
              ></span>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="flex-1 overflow-hidden">
            <ParticipantList
              v-if="store.tabActive === 'participants'"
              :participants="store.participants"
            />
            <ChatPanel
              v-else
              :messages="store.messages"
              :participants="store.participants"
              :current-user-id="currentUserId"
              @send-message="store.sendMessage"
            />
          </div>
        </template>
      </aside>
    </main>

    <!-- Debug Console (Collapsible) -->
    <div
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
    </div>
  </body>
</template>

<script setup lang="ts">
import ChatPanel from '~/components/views/ChatPanel.vue'
import ParticipantGrid from '~/components/views/ParticipantGrid.vue'
import ParticipantList from '~/components/views/ParticipantList.vue'
import ParticipantThumbnails from '~/components/views/ParticipantThumbnails.vue'
import { useMeetingStore } from '~/stores/meeting'

const store = useMeetingStore()

// Get current user ID
const currentUserId = computed(() => {
  const you = store.participants.find((p) => p.isYou)
  return you?.id || '1'
})
</script>

<style scoped></style>
