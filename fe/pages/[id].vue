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
              @click="
                store.isScreenSharing
                  ? store.setTabActive('grid')
                  : store.setTabActive('participants')
              "
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

            <!-- Recording Status Badge (for host/co-host) -->
            <transition
              enter-active-class="transition-all duration-300 ease-out"
              leave-active-class="transition-all duration-300 ease-in"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <div
                v-if="recording && (isHost || isCoHost)"
                class="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-danger border border-red-100 dark:border-red-900/30"
              >
                <span
                  class="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                ></span>
                <p class="font-mono text-sm font-medium tabular-nums">
                  {{ formatDuration(recordingDuration) }}
                </p>
              </div>
            </transition>

            <!-- Recording Status Badge (for non-host participants) -->
            <transition
              enter-active-class="transition-all duration-300 ease-out"
              leave-active-class="transition-all duration-300 ease-in"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <div
                v-if="store.isRecording && !isHost && !isCoHost"
                class="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-danger border border-red-100 dark:border-red-900/30"
              >
                <span
                  class="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                ></span>
                <p class="text-sm font-medium tabular-nums text-red-500">
                  Host is recording this meeting
                </p>
              </div>
            </transition>
          </div>

          <!-- Screen Share Notification -->
          <transition
            enter-active-class="transition-all duration-300 ease-out"
            leave-active-class="transition-all duration-300 ease-in"
            enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-2"
          >
            <div
              v-if="store.isScreenSharing"
              class="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200"
              :class="
                isSomeoneElseSharing
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30'
                  : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30'
              "
            >
              <div
                class="flex items-center justify-center w-8 h-8 rounded-full animate-pulse"
                :class="
                  isSomeoneElseSharing
                    ? 'bg-blue-100 dark:bg-blue-800/30'
                    : 'bg-green-100 dark:bg-green-800/30'
                "
              >
                <UIcon
                  name="material-symbols:present-to-all"
                  class="text-[18px]"
                  :class="
                    isSomeoneElseSharing
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-green-600 dark:text-green-400'
                  "
                />
              </div>
              <div class="flex flex-col">
                <p
                  class="text-sm font-semibold"
                  :class="
                    isSomeoneElseSharing
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-green-700 dark:text-green-300'
                  "
                >
                  {{
                    isSomeoneElseSharing
                      ? `${screenSharerName} is sharing their screen`
                      : "You are sharing your screen"
                  }}
                </p>
                <p
                  class="text-xs"
                  :class="
                    isSomeoneElseSharing
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-green-600 dark:text-green-400'
                  "
                >
                  {{
                    isSomeoneElseSharing
                      ? "Viewing presentation"
                      : "Others can see your screen"
                  }}
                </p>
              </div>
            </div>
          </transition>

          <!-- Right Actions -->
          <div class="flex items-center gap-3">
            <!-- <button
              class="flex items-center justify-center h-9 px-4 rounded-full bg-primary text-white text-sm font-bold hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm shadow-blue-200 dark:shadow-none"
            >
              <UIcon
                name="material-symbols:person-add"
                class="text-[18px] mr-2"
              />
              Invite
            </button> -->
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
                :local-stream="localStreamComputed"
                :remote-streams="remoteStreamsComputed"
              >
                <template #controls>
                  <div
                    class="flex items-center gap-3 p-2 bg-white/60 dark:bg-surface-dark rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 dark:border-slate-700 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95"
                  >
                    <button
                      @click="handleToggleMic"
                      class="cursor-pointer group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all duration-200"
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
                  class="cursor-pointer group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all duration-200"
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
                  class="cursor-pointer group relative w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                  @click="handleToggleRecording"
                  :disabled="!isHost && !isCoHost"
                  class="group relative w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  :class="
                    recording
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  "
                  :title="
                    !isHost && !isCoHost
                      ? 'Only host or co-host can record'
                      : recording
                        ? 'Stop Recording'
                        : 'Record'
                  "
                >
                  <UIcon
                    name="material-symbols:radio-button-checked"
                    class="size-6"
                    :class="recording ? 'animate-pulse' : ''"
                  />
                  <span
                    v-if="isHost || isCoHost"
                    class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                  >
                    {{
                      recording
                        ? `Stop (${formatDuration(recordingDuration)})`
                        : "Record"
                    }}
                  </span>
                </button>
                <button
                  @click="store.setTabActive('chat')"
                  class="cursor-pointer group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all duration-200"
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
                  class="cursor-pointer w-16 h-12 rounded-full flex items-center justify-center bg-danger text-white bg-red-500 hover:bg-red-700 hover:scale-110 active:scale-95 shadow-md shadow-red-200 dark:shadow-none transition-all duration-200"
                  title="End Call"
                >
                  <UIcon name="material-symbols:call-end" class="size-6" />
                </button>
              </div>
            </template>
          </ParticipantGrid>
        </transition>
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
              v-if="store.showSidePanel"
              class="w-[320px] xl:w-90 bg-white dark:bg-surface-dark border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 shrink-0 relative"
            >
              <button
                @click="store.toggleSidePanel()"
                class="absolute top-2 -left-4 w-7 h-7 rounded-full bg-red-500 dark:bg-red-800 flex items-center justify-center hover:bg-red-600 dark:hover:bg-red-700 hover:scale-110 active:scale-95 transition-all duration-200 z-20"
                :title="store.showSidePanel ? 'Hide Panel' : 'Show Panel'"
              >
                <UIcon
                  :name="
                    store.showSidePanel
                      ? 'material-symbols:arrow-forward-ios'
                      : 'material-symbols:arrow-back-ios'
                  "
                  class="text-[16px] text-white"
                />
              </button>
              <!-- Screen Sharing Mode: Video Thumbnails -->
              <template v-if="store.tabActive === 'grid'">
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
                  :local-stream="localStreamComputed"
                  :remote-streams="remoteStreamsComputed"
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

        <!-- Recording Modals -->
        <!-- Stop Recording Confirmation Modal -->
        <transition
          enter-active-class="transition-all duration-200 ease-out"
          leave-active-class="transition-all duration-200 ease-in"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showStopRecordingModal"
            class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
            @click.self="showStopRecordingModal = false"
          >
            <div
              class="bg-white dark:bg-surface-dark rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700"
            >
              <h3
                class="text-lg font-semibold mb-2 text-slate-900 dark:text-white"
              >
                Hentikan rekaman?
              </h3>
              <p class="text-slate-600 dark:text-slate-400 mb-4">
                Rekaman akan diunggah otomatis setelah dihentikan.
              </p>
              <div class="flex gap-2 justify-end">
                <button
                  class="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  @click="showStopRecordingModal = false"
                >
                  Lanjut Rekam
                </button>
                <button
                  class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  @click="stopRecording"
                >
                  Hentikan & Upload
                </button>
              </div>
            </div>
          </div>
        </transition>

        <!-- Uploading Modal -->
        <transition
          enter-active-class="transition-all duration-200 ease-out"
          leave-active-class="transition-all duration-200 ease-in"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showUploadingModal"
            class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
          >
            <div
              class="bg-white dark:bg-surface-dark rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700"
            >
              <h3
                class="text-lg font-semibold mb-2 text-slate-900 dark:text-white"
              >
                Mengunggah rekaman…
              </h3>
              <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Jangan tutup tab sampai selesai.
              </p>
              <div class="mb-4">
                <div
                  class="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1"
                >
                  <span class="truncate max-w-[70%]">{{
                    uploadedFileName
                  }}</span>
                  <span class="font-mono">{{ uploadProgress }}%</span>
                </div>
                <div
                  class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"
                >
                  <div
                    class="bg-blue-500 h-2 rounded-full transition-all duration-300"
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
        </transition>

        <!-- Upload Success Modal -->
        <transition
          enter-active-class="transition-all duration-200 ease-out"
          leave-active-class="transition-all duration-200 ease-in"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showUploadSuccessModal"
            class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
            @click.self="closeUploadSuccessModal"
          >
            <div
              class="bg-white dark:bg-surface-dark rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700"
            >
              <div class="text-center mb-4">
                <div class="text-5xl mb-2">✅</div>
                <h3
                  class="text-lg font-semibold mb-2 text-slate-900 dark:text-white"
                >
                  Rekaman berhasil diunggah
                </h3>
                <p class="text-slate-600 dark:text-slate-400">
                  File tersimpan di server.
                </p>
              </div>
              <div
                class="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mb-4 text-sm border border-slate-200 dark:border-slate-700"
              >
                <div
                  class="font-medium mb-1 text-slate-900 dark:text-white truncate"
                >
                  {{ uploadedFileName }}
                </div>
                <div
                  class="text-slate-600 dark:text-slate-400 truncate text-xs"
                >
                  {{ uploadedFileUrl }}
                </div>
              </div>
              <div class="flex gap-2 flex-col">
                <button
                  class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  @click="copyRecordingLink"
                >
                  Salin Link
                </button>
                <div class="flex gap-2">
                  <button
                    class="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                    @click="closeUploadSuccessModal"
                  >
                    Tutup
                  </button>
                  <button
                    v-if="isHost || isCoHost"
                    class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    @click="startAnotherRecording"
                  >
                    Rekam Lagi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- Upload Error Modal -->
        <transition
          enter-active-class="transition-all duration-200 ease-out"
          leave-active-class="transition-all duration-200 ease-in"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="showUploadErrorModal"
            class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
            @click.self="showUploadErrorModal = false"
          >
            <div
              class="bg-white dark:bg-surface-dark rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700"
            >
              <div class="text-center mb-4">
                <div class="text-5xl mb-2">❌</div>
                <h3
                  class="text-lg font-semibold mb-2 text-slate-900 dark:text-white"
                >
                  Upload gagal
                </h3>
                <p class="text-slate-600 dark:text-slate-400">
                  Koneksi tidak stabil atau server bermasalah.
                </p>
              </div>
              <div
                class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3 mb-4 text-sm text-red-700 dark:text-red-400"
              >
                {{ uploadError }}
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Rekaman tetap tersedia di perangkat ini sampai kamu menutup tab.
              </p>
              <div class="flex gap-2 flex-col">
                <button
                  class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  @click="retryUpload"
                >
                  Coba Upload Lagi
                </button>
                <div class="flex gap-2">
                  <button
                    class="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                    @click="downloadRecording"
                  >
                    Download .webm
                  </button>
                  <button
                    class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    @click="discardRecording"
                  >
                    Buang Rekaman
                  </button>
                </div>
              </div>
            </div>
          </div>
        </transition>

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
const config = useRuntimeConfig();

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

  // Initialize WebRTC only on client
  if (process.client) {
    // Validate username
    if (!username.value) {
      console.error("[PAGE] No username provided, redirecting to home");
      router.push("/");
      return;
    }

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

// watch webrtc and log when it's set
watch(
  webrtc,
  (newVal) => {
    console.log("web rtc value:", newVal);
  },
  { immediate: true },
);

// Get current user ID
const currentUserId = computed(() => {
  const you = store.participants.find((p) => p.isYou);
  return you?.id || "";
});

// Check if current user is host
const isHost = computed(() => {
  if (!webrtc.value) return false;
  return webrtc.value.hostSocketId === currentUserId.value;
});

// Check if current user is co-host
const isCoHost = computed(() => {
  if (!webrtc.value) return false;
  return webrtc.value.coHostSocketIds?.includes(currentUserId.value) || false;
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

// ============= RECORDING STATE =============
const recording = ref(false);
const recordingDuration = ref(0);
let recordingTimer: NodeJS.Timeout | null = null;
let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];

// Modal states
const showStopRecordingModal = ref(false);
const showUploadingModal = ref(false);
const showUploadSuccessModal = ref(false);
const showUploadErrorModal = ref(false);

// Upload states
const uploadProgress = ref(0);
const uploadError = ref("");
const uploadedFileName = ref("");
const uploadedFileUrl = ref("");

// Format duration helper
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

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

// Computed refs for proper reactivity when passing to child components
const localStreamComputed = computed(() => {
  return webrtc.value?.localStream ?? null;
});

const remoteStreamsComputed = computed(() => {
  return webrtc.value?.remoteStreams ?? new Map<string, MediaStream>();
});

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
  const whoIsSharing = webrtc.value.whoIsSharing;
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

// ============= RECORDING FUNCTIONS =============
const log = (message: string) => {
  console.log(`[RECORDING] ${message}`);
};

async function startRecording() {
  log("startRecording() called");

  // Check if host or co-host
  if (!isHost.value && !isCoHost.value) {
    toast.error("Permission Denied", "Only host or co-host can record");
    return;
  }

  try {
    recordedChunks = [];

    // Create canvas for composite recording
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    log("Canvas created: 1920x1080");

    // Wait for video elements to be ready
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Set recording flag
    recording.value = true;
    store.isRecording = true;

    // Rendering function
    let frameCount = 0;
    const renderFrame = () => {
      if (!recording.value) {
        log("Recording stopped, ending render loop");
        return;
      }

      frameCount++;
      if (frameCount % 60 === 0) {
        log(`Rendered ${frameCount} frames`);
      }

      // Clear canvas
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dynamic layout detection
      const currentHasScreenShare = store.isScreenSharing;

      // Collect video sources dynamically
      const currentVideoSources: Array<{
        element: HTMLVideoElement;
        label: string;
      }> = [];

      // Collect local camera
      if (localStreamComputed.value) {
        const videos = document.querySelectorAll<HTMLVideoElement>(
          'video[data-participant="local"]',
        );
        if (videos.length > 0) {
          currentVideoSources.push({ element: videos[0], label: "local" });
        }
      }

      // Collect remote cameras
      if (webrtc.value?.remoteStreams) {
        for (const [socketId, stream] of webrtc.value.remoteStreams) {
          const videos = document.querySelectorAll<HTMLVideoElement>(
            `video[data-participant="${socketId}"]`,
          );
          if (videos.length > 0) {
            currentVideoSources.push({ element: videos[0], label: socketId });
          }
        }
      }

      // Screen share layout
      if (currentHasScreenShare) {
        const screenShareVideo = document.querySelector<HTMLVideoElement>(
          'video[data-screen-share="true"]',
        );

        if (screenShareVideo && screenShareVideo.readyState >= 2) {
          // Draw screen share (main area)
          const mainWidth = canvas.width * 0.75;
          const mainHeight = canvas.height;

          const videoAspect =
            screenShareVideo.videoWidth / screenShareVideo.videoHeight;
          const mainAspect = mainWidth / mainHeight;

          let drawWidth, drawHeight, drawX, drawY;

          if (videoAspect > mainAspect) {
            drawWidth = mainWidth;
            drawHeight = mainWidth / videoAspect;
            drawX = 0;
            drawY = (mainHeight - drawHeight) / 2;
          } else {
            drawHeight = mainHeight;
            drawWidth = mainHeight * videoAspect;
            drawX = (mainWidth - drawWidth) / 2;
            drawY = 0;
          }

          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(0, 0, mainWidth, mainHeight);
          ctx.drawImage(screenShareVideo, drawX, drawY, drawWidth, drawHeight);
        }

        // Draw participant thumbnails in sidebar
        const sidebarX = canvas.width * 0.75;
        const sidebarWidth = canvas.width * 0.25;
        const participantHeight = 200;
        const participantGap = 10;

        currentVideoSources.forEach((source, idx) => {
          const y = idx * (participantHeight + participantGap);
          const videoEl = source.element;

          if (videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
            const videoAspect = videoEl.videoWidth / videoEl.videoHeight;
            const cellAspect = sidebarWidth / participantHeight;

            let drawWidth, drawHeight, drawX, drawY;

            if (videoAspect > cellAspect) {
              drawWidth = sidebarWidth;
              drawHeight = sidebarWidth / videoAspect;
              drawX = sidebarX;
              drawY = y + (participantHeight - drawHeight) / 2;
            } else {
              drawHeight = participantHeight;
              drawWidth = participantHeight * videoAspect;
              drawX = sidebarX + (sidebarWidth - drawWidth) / 2;
              drawY = y;
            }

            ctx.fillStyle = "#1a1a1a";
            ctx.fillRect(sidebarX, y, sidebarWidth, participantHeight);
            ctx.drawImage(videoEl, drawX, drawY, drawWidth, drawHeight);
          }

          // Draw border
          ctx.strokeStyle = "#444";
          ctx.lineWidth = 2;
          ctx.strokeRect(sidebarX, y, sidebarWidth, participantHeight);
        });
      } else {
        // Grid layout for all participants
        const allParticipants = store.participants;
        const participantCount = allParticipants.length;

        if (participantCount === 0) {
          ctx.fillStyle = "#fff";
          ctx.font = "48px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            "Waiting for participants...",
            canvas.width / 2,
            canvas.height / 2,
          );
        } else {
          const cols = Math.ceil(Math.sqrt(participantCount));
          const rows = Math.ceil(participantCount / cols);
          const cellWidth = canvas.width / cols;
          const cellHeight = canvas.height / rows;

          allParticipants.forEach((participant, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = col * cellWidth;
            const y = row * cellHeight;

            const participantVideo = currentVideoSources.find(
              (s) =>
                (participant.isYou && s.label === "local") ||
                s.label === participant.id,
            );

            // ALWAYS draw participant - dengan video atau placeholder
            if (participantVideo) {
              const videoEl = participantVideo.element;

              if (videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
                const videoAspect = videoEl.videoWidth / videoEl.videoHeight;
                const cellAspect = cellWidth / cellHeight;

                let drawWidth, drawHeight, drawX, drawY;

                if (videoAspect > cellAspect) {
                  drawWidth = cellWidth;
                  drawHeight = cellWidth / videoAspect;
                  drawX = x;
                  drawY = y + (cellHeight - drawHeight) / 2;
                } else {
                  drawHeight = cellHeight;
                  drawWidth = cellHeight * videoAspect;
                  drawX = x + (cellWidth - drawWidth) / 2;
                  drawY = y;
                }

                ctx.fillStyle = "#1a1a1a";
                ctx.fillRect(x, y, cellWidth, cellHeight);
                ctx.drawImage(videoEl, drawX, drawY, drawWidth, drawHeight);
              } else {
                // Video element exists tapi not ready - show placeholder
                ctx.fillStyle = "#1a1a1a";
                ctx.fillRect(x, y, cellWidth, cellHeight);
                ctx.fillStyle = "#555";
                ctx.font = `${Math.min(cellWidth, cellHeight) / 3}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("👤", x + cellWidth / 2, y + cellHeight / 2);
              }
            } else {
              // Camera OFF - TETAP DRAW PLACEHOLDER
              ctx.fillStyle = "#1a1a1a";
              ctx.fillRect(x, y, cellWidth, cellHeight);
              ctx.fillStyle = "#555";
              ctx.font = `${Math.min(cellWidth, cellHeight) / 3}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("👤", x + cellWidth / 2, y + cellHeight / 2 - 30);
              ctx.fillStyle = "#888";
              ctx.font = `${Math.min(cellWidth, cellHeight) / 12}px sans-serif`;
              ctx.fillText(
                "Camera Off",
                x + cellWidth / 2,
                y + cellHeight / 2 + 30,
              );
            }

            // ALWAYS draw name label untuk setiap participant
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(x + 10, y + cellHeight - 40, 150, 30);
            ctx.fillStyle = "#fff";
            ctx.font = "16px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(
              participant.isYou ? "You" : participant.name,
              x + 15,
              y + cellHeight - 15,
            );
          });
        }
      }

      requestAnimationFrame(renderFrame);
    };

    // Start render loop
    log("Starting render loop...");
    renderFrame();

    // Wait for first frame
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Capture canvas stream
    const canvasStream = canvas.captureStream(30);
    log("Stream captured at 30 FPS");

    // Audio mixing
    const audioContext = new AudioContext();
    if (audioContext.state === "suspended") {
      await audioContext.resume();
      log("AudioContext resumed");
    }

    const audioDestination = audioContext.createMediaStreamDestination();
    let audioSourceCount = 0;

    // Add local mic audio
    if (localStreamComputed.value && !store.isMuted) {
      const audioTracks = localStreamComputed.value.getAudioTracks();
      if (audioTracks.length > 0) {
        const source = audioContext.createMediaStreamSource(
          new MediaStream([audioTracks[0]]),
        );
        source.connect(audioDestination);
        audioSourceCount++;
        log("Added local mic audio");
      }
    }

    // Add screen share audio
    const localScreen = webrtc.value?.getLocalScreenStream();
    if (localScreen) {
      const audioTracks = localScreen.getAudioTracks();
      if (audioTracks.length > 0) {
        const source = audioContext.createMediaStreamSource(
          new MediaStream([audioTracks[0]]),
        );
        source.connect(audioDestination);
        audioSourceCount++;
        log("Added screen share audio");
      }
    }

    // Add remote participant audio
    if (webrtc.value?.remoteStreams) {
      for (const [peerId, stream] of webrtc.value.remoteStreams) {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          try {
            const source = audioContext.createMediaStreamSource(
              new MediaStream([audioTracks[0]]),
            );
            source.connect(audioDestination);
            audioSourceCount++;
            log(`Added audio from ${peerId}`);
          } catch (e: any) {
            log(`Error adding audio from ${peerId}: ${e.message}`);
          }
        }
      }
    }

    // Add remote screen share audio
    if (webrtc.value?.screenShareStreams) {
      for (const [peerId, stream] of webrtc.value.screenShareStreams) {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
          try {
            const source = audioContext.createMediaStreamSource(
              new MediaStream([audioTracks[0]]),
            );
            source.connect(audioDestination);
            audioSourceCount++;
            log(`Added screen share audio from ${peerId}`);
          } catch (e: any) {
            log(`Error adding screen share audio from ${peerId}: ${e.message}`);
          }
        }
      }
    }

    // Silent track if no audio
    if (audioSourceCount === 0) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      gain.gain.value = 0.00001;
      osc.connect(gain).connect(audioDestination);
      osc.start();
      log("Injected silent track");
    }

    log(`Total audio sources mixed: ${audioSourceCount}`);

    // Combine video and audio
    const recordStream = new MediaStream();
    canvasStream
      .getVideoTracks()
      .forEach((track) => recordStream.addTrack(track));
    audioDestination.stream
      .getAudioTracks()
      .forEach((track) => recordStream.addTrack(track));

    log(
      `Final stream - video: ${recordStream.getVideoTracks().length}, audio: ${recordStream.getAudioTracks().length}`,
    );

    // Select mimeType
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp8",
      "video/webm",
    ];

    const chosenMimeType = candidates.find((t) =>
      MediaRecorder.isTypeSupported(t),
    );
    if (!chosenMimeType)
      throw new Error("No supported MediaRecorder mimeType found");

    log(`Selected mimeType: ${chosenMimeType}`);

    // Create MediaRecorder
    mediaRecorder = new MediaRecorder(recordStream, {
      mimeType: chosenMimeType,
      videoBitsPerSecond: 2_500_000,
    });

    mediaRecorder.ondataavailable = (event) => {
      const size = event.data?.size || 0;
      if (event.data && size > 0) {
        recordedChunks.push(event.data);
        if (recordedChunks.length % 5 === 0) {
          log(`Chunk ${recordedChunks.length}: ${size} bytes`);
        }
      }
    };

    mediaRecorder.onstop = () => {
      log("MediaRecorder.onstop fired!");
      log(`Total chunks: ${recordedChunks.length}`);

      // Stop render loop
      recording.value = false;

      // Stop canvas track
      try {
        canvasStream.getTracks().forEach((t) => t.stop());
      } catch {}

      // Cleanup audio context
      try {
        audioContext.close();
      } catch {}

      if (recordingTimer) {
        clearInterval(recordingTimer);
      }

      setTimeout(async () => {
        log("Starting upload process...");
        await uploadRecording();
      }, 100);
    };

    mediaRecorder.onerror = (event: any) => {
      log(`MediaRecorder error: ${event?.error?.message || "unknown"}`);
    };

    mediaRecorder.onstart = () => {
      log("MediaRecorder started successfully");
    };

    // Start recorder with timeslice
    mediaRecorder.start(1000);

    log(`Recording started, state: ${mediaRecorder.state}`);

    recordingDuration.value = 0;
    recordingTimer = setInterval(() => {
      recordingDuration.value++;
    }, 1000);

    log(`Recording started (${audioSourceCount} audio tracks)`);

    // Emit recording-started event
    if (webrtc.value) {
      webrtc.value.emitRecordingStarted();
    }

    toast.success("Recording Started", "Meeting is now being recorded");
  } catch (err: any) {
    log(`Recording failed: ${err?.message || err}`);
    recording.value = false;
    store.isRecording = false;
    toast.error("Recording Failed", err?.message || "An error occurred");
  }
}

function confirmStopRecording() {
  showStopRecordingModal.value = true;
}

function stopRecording() {
  showStopRecordingModal.value = false;

  log("stopRecording() called");

  if (mediaRecorder && recording.value) {
    log(`MediaRecorder state: ${mediaRecorder.state}`);
    log(`Chunks collected so far: ${recordedChunks.length}`);

    if (
      mediaRecorder.state === "recording" ||
      mediaRecorder.state === "paused"
    ) {
      try {
        log("Calling mediaRecorder.stop()...");
        mediaRecorder.stop();
        log("mediaRecorder.stop() executed successfully");
      } catch (err: any) {
        log(`Error calling stop(): ${err.message}`);
      }
    }
  } else {
    log("Cannot stop: mediaRecorder not active");
  }
}

async function uploadRecording() {
  const apiUrl = (config.public.socketUrl as string) || "http://localhost:3001";

  if (recordedChunks.length === 0) {
    log("No chunks to upload");
    recording.value = false;
    store.isRecording = false;
    return;
  }

  log(`Creating blob from ${recordedChunks.length} chunks...`);
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  log(
    `Blob size: ${blob.size} bytes (${(blob.size / 1024 / 1024).toFixed(2)} MB)`,
  );

  const formData = new FormData();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const filename = `room-${roomId.value}-${timestamp}.webm`;

  formData.append("recording", blob, filename);
  formData.append("roomId", roomId.value);
  formData.append("timestamp", timestamp);

  uploadedFileName.value = filename;
  showUploadingModal.value = true;
  uploadProgress.value = 0;

  try {
    log("Starting upload with fetch...");
    log(`API URL: ${apiUrl}/api/upload-recording`);
    log(
      `FormData contents: recording (${blob.size} bytes), roomId (${roomId.value}), timestamp (${timestamp})`,
    );

    const response = await fetch(`${apiUrl}/api/upload-recording`, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
    });

    log(`Response status: ${response.status} ${response.statusText}`);
    log(`Response headers: ${JSON.stringify([...response.headers.entries()])}`);

    // Simulate progress (fetch doesn't support upload progress without streams)
    uploadProgress.value = 50;
    await new Promise((resolve) => setTimeout(resolve, 100));
    uploadProgress.value = 100;

    if (!response.ok) {
      const errorText = await response.text();
      log(`Error response body: ${errorText}`);
      throw new Error(
        `Upload failed with status ${response.status}: ${errorText}`,
      );
    }

    const contentType = response.headers.get("content-type");
    log(`Response content-type: ${contentType}`);

    let result;
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
      log(`Response JSON: ${JSON.stringify(result)}`);
    } else {
      const text = await response.text();
      log(`Response text: ${text}`);
      throw new Error(`Expected JSON response but got: ${text}`);
    }

    // Check if upload was successful - either has success=true OR has url+filename
    if (
      result &&
      (result.success === true || (result.url && result.filename))
    ) {
      log(`✅ Recording saved: ${result.filename}`);
      log(`📹 URL: ${result.url}`);
      log(`📦 Size: ${result.size} bytes`);

      recording.value = false;
      store.isRecording = false;

      uploadedFileUrl.value = result.url;
      uploadedFileName.value = result.filename;
      showUploadingModal.value = false;
      showUploadSuccessModal.value = true;

      // Emit recording-stopped event
      if (webrtc.value) {
        webrtc.value.emitRecordingStopped();
      }

      toast.success("Upload Complete", "Recording saved successfully");
    } else {
      log(`❌ Upload failed: ${result?.error || "Unknown error"}`);
      throw new Error(result?.error || "Upload failed - no URL returned");
    }
  } catch (err: any) {
    log(`❌ Upload exception: ${err?.message || err}`);
    console.error("[RECORDING] Full error:", err);

    recording.value = false;
    store.isRecording = false;

    uploadError.value = err?.message || err?.toString() || "Network error";
    showUploadingModal.value = false;
    showUploadErrorModal.value = true;
  }
}

function copyRecordingLink() {
  navigator.clipboard.writeText(uploadedFileUrl.value);
  toast.success("Link Copied", "Recording URL copied to clipboard");
}

function closeUploadSuccessModal() {
  showUploadSuccessModal.value = false;
  recordedChunks = [];
}

function startAnotherRecording() {
  showUploadSuccessModal.value = false;
  recordedChunks = [];
  if (isHost.value || isCoHost.value) {
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
  toast.success("Downloaded", "Recording saved to your device");
  showUploadErrorModal.value = false;
  recordedChunks = [];
}

function discardRecording() {
  showUploadErrorModal.value = false;
  recordedChunks = [];
  log("Recording discarded");
  toast.info("Discarded", "Recording has been discarded");
}

// Handle toggle recording
const handleToggleRecording = () => {
  if (!isHost.value && !isCoHost.value) {
    toast.error("Permission Denied", "Only host or co-host can record");
    return;
  }

  if (recording.value) {
    confirmStopRecording();
  } else {
    startRecording();
  }
};

// Cleanup on unmount
onBeforeUnmount(() => {
  if (recordingTimer) {
    clearInterval(recordingTimer);
  }
  if (recording.value && mediaRecorder) {
    stopRecording();
  }
});
</script>

<style scoped></style>
