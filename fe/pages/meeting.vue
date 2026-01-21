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
          <h2 class="text-lg font-bold tracking-tight">room-1</h2>
        </div>
        <div class="h-4 w-px bg-slate-300 dark:bg-slate-700"></div>
        <div
          class="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-light dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        >
          <UIcon
            name="material-symbols:group"
            class="text-slate-500 text-[18px]"
          />
          <span class="text-sm font-medium text-slate-600 dark:text-slate-300"
            >3 Participants</span
          >
        </div>
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
      <!-- Video Grid (75%) -->
      <div
        class="flex-1 p-4 flex flex-col items-center justify-center bg-surface-light dark:bg-background-dark relative"
      >
        <div
          class="grid grid-cols-2 grid-rows-2 gap-4 w-full h-full max-w-6xl max-h-[800px]"
        >
          <!-- Tile 1: Active Speaker -->
          <div
            class="relative group rounded-2xl overflow-hidden bg-slate-900 shadow-lg ring-4 ring-primary ring-offset-2 ring-offset-surface-light dark:ring-offset-background-dark transition-all duration-300"
          >
            <div
              class="absolute inset-0 bg-cover bg-center"
              data-alt="Woman in office smiling during video call"
              style="
                background-image: url(&quot;https://lh3.googleusercontent.com/aida-public/AB6AXuBhCd45mxVYjylOIAHCBUT4-mwJvuAMpkuVsgW-636soosESCxbzxaSpP88xxj7ICzWMA-TB76h-tmS04NAvLXFa7KCyV_440fYUumv5Fbi28SfuLrMg01H23T1cwWYgmRig3r1_DiqtMHpNMiHv0C-BtEK3uFAOhYUZBR0KJtje8L8VrwZuLgxXULmsuEw0bdq_RmpVHzmOuTYtAjWQEpUaN1H27fQecQGqfoEMpD6lRMsYKzGuoHAlgvYDUf4Q6im2RCfVB9aFxkC&quot;);
              "
            ></div>
            <!-- Gradient Scrim -->
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"
            ></div>
            <!-- Top Right Indicators -->
            <div class="absolute top-4 right-4 flex gap-2">
              <div
                class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10"
              >
                <UIcon
                  name="material-symbols:mic"
                  class="text-white text-[18px]"
                />
              </div>
            </div>
            <!-- Bottom Left Label -->
            <div class="absolute bottom-4 left-4">
              <p class="text-white text-base font-semibold drop-shadow-md">
                Alice (You)
              </p>
              <p
                class="text-primary text-xs font-medium flex items-center gap-1 mt-0.5"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Active Speaker
              </p>
            </div>
            <!-- Audio Visualizer (Fake) -->
            <div class="absolute bottom-4 right-4 flex items-end gap-1 h-4">
              <div
                class="w-1 bg-primary rounded-full h-full animate-[pulse_0.5s_ease-in-out_infinite]"
              ></div>
              <div
                class="w-1 bg-primary rounded-full h-3/4 animate-[pulse_0.4s_ease-in-out_infinite]"
              ></div>
              <div
                class="w-1 bg-primary rounded-full h-1/2 animate-[pulse_0.6s_ease-in-out_infinite]"
              ></div>
            </div>
          </div>
          <!-- Tile 2 -->
          <div
            class="relative group rounded-2xl overflow-hidden bg-slate-800 shadow-md"
          >
            <div
              class="absolute inset-0 bg-cover bg-center"
              data-alt="Man in suit portrait facing camera"
              style="
                background-image: url(&quot;https://lh3.googleusercontent.com/aida-public/AB6AXuAkBo8ssoVQXch8pWvg9cDbQYhQBxpSDwbMZaPdj09iV9jZ_PeaGkLXKv8nUYMjZoHLarC7aJZ1cEu2xHD6_8Q8utmaEGaTFerxFdTaPs1y13GmlsYluX3a8GWVNl-Q85BFxDUSoUqDzToAgwDGs-NizbVgznLT3IlzkBDPl3xdYpDLjgg4_faY9lhFInrJaB6qV5KFIMQHD3hoFdI7HJpNYQZQpEOSgmnjC__2p0vbjJwH_lZ4K9zqkRxveA2RReYKDQ7YQI1oGAbS&quot;);
              "
            ></div>
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60"
            ></div>
            <div class="absolute bottom-4 left-4">
              <p class="text-white text-base font-semibold drop-shadow-md">
                Bob Smith
              </p>
            </div>
          </div>
          <!-- Tile 3 -->
          <div
            class="relative group rounded-2xl overflow-hidden bg-slate-800 shadow-md"
          >
            <div
              class="absolute inset-0 bg-cover bg-center"
              data-alt="Woman with glasses portrait smiling"
              style="
                background-image: url(&quot;https://lh3.googleusercontent.com/aida-public/AB6AXuAG1D5SUsZkUjbtwEW-2up9xEU6-nU1SNP0kbqk8gR8KaKG60lnljV1XfPAI3-5Xz6Y0DzxZp4Vx3Ze6CnDF3fLT0OjYAcLPZq1f-krUvzYDdG-cgpxzg4obxTPVCExwcaChzq_zVMLlxYMkbcAFnjIGRIly0pLvpb93yvKdeCHeE-rMHunDDYlC2N-i5VA-b7Xz8ZGMXWqFM27Z0V1OFUsRO9dOaw9HDqIcyENWqLyu_S52bZRtepChW4EcvonsHlobslOz0IxctnG&quot;);
              "
            ></div>
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60"
            ></div>
            <!-- Muted Indicator -->
            <div class="absolute top-4 right-4">
              <div
                class="w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center border border-red-400/30"
              >
                <UIcon
                  name="material-symbols:mic-off"
                  class="text-white text-[18px]"
                />
              </div>
            </div>
            <div class="absolute bottom-4 left-4">
              <p class="text-white text-base font-semibold drop-shadow-md">
                Charlie
              </p>
              <p class="text-slate-300 text-xs font-medium mt-0.5">Muted</p>
            </div>
          </div>
          <!-- Tile 4 (Empty/Invited) -->
          <div
            class="relative group rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500"
          >
            <div
              class="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-3"
            >
              <UIcon name="material-symbols:person" class="text-[32px]" />
            </div>
            <p class="font-medium text-sm">Fajar Ganteng</p>
          </div>
        </div>
        <!-- Floating Bottom Control Bar -->
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
          <div
            class="flex items-center gap-3 p-2 bg-white dark:bg-surface-dark rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 dark:border-slate-700 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95"
          >
            <button
              class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              title="Mute Microphone"
            >
              <UIcon name="material-symbols:mic" class="size-6" />
              <span
                class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                >Mute</span
              >
            </button>
            <button
              class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              title="Turn Off Camera"
            >
              <UIcon name="material-symbols:videocam" class="size-6" />
            </button>
            <div class="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
            <button
              class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-all"
              title="Share Screen"
            >
              <UIcon name="material-symbols:present-to-all" class="size-6" />
            </button>
            <button
              class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              title="Record"
            >
              <UIcon
                name="material-symbols:radio-button-checked"
                class="size-6"
              />
            </button>
            <button
              @click="handleSidePanel('chat')"
              class="group relative w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              title="Show Chat"
            >
              <UIcon name="material-symbols:chat-bubble" class="size-6" />
              <span
                v-if="hasUnreadMessage"
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
        v-if="showSidePanel"
        class="w-[320px] xl:w-90 bg-white dark:bg-surface-dark border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 shrink-0"
      >
        <!-- Tabs -->
        <div
          class="flex items-center p-4 border-b border-slate-100 dark:border-slate-800"
        >
          <button
            class="flex-1 pb-3 text-sm font-semibold text-primary border-b-2 border-primary"
          >
            Participants (3)
          </button>
          <button
            class="flex-1 pb-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-b-2 border-transparent transition-colors"
          >
            Chat
          </button>
        </div>
        <!-- List -->
        <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <!-- Invite Block -->
          <div
            class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 mb-2"
          >
            <p
              class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3"
            >
              Add people
            </p>
            <div class="flex gap-2">
              <button
                class="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                <UIcon
                  name="material-symbols:content-copy"
                  class="text-[18px]"
                />
                Copy Link
              </button>
              <button
                class="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                <UIcon name="material-symbols:mail" class="text-[18px]" />
                Email
              </button>
            </div>
          </div>
          <p
            class="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2"
          >
            In Call
          </p>
          <!-- Participant Item 1 (You) -->
          <div class="flex items-center justify-between group">
            <div class="flex items-center gap-3">
              <div class="relative">
                <div
                  class="w-10 h-10 rounded-full bg-cover bg-center ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-surface-dark"
                  data-alt="Alice Avatar"
                  style="
                    background-image: url(&quot;https://lh3.googleusercontent.com/aida-public/AB6AXuCf9_qDE-Ax3RAzkNPs5Fxlb08NkTzIFliKBGWAlYDkDMFT5kfkpBommZgZeNA0quiPU-4k2v3NHukrcbjldYJVXWVc8yysiX2miDtUwQnjbZM-3dp5ID6BUDeTjnUEaQSGbzpqHbKUiPCNWmt8CRSf5z4XlwXpPg9Wnyaa_Sc4M0e_lOWFq8vmyLJV42KJGI-mm575jQsoDIGIyoXLyuJqyMcBWlPICrKXjhUEM6VGD9M6grX8s3OtAOtcYP-z8JgsQtl9kWuTF-Qy&quot;);
                  "
                ></div>
                <div
                  class="absolute -bottom-1 -right-1 bg-white dark:bg-surface-dark rounded-full p-0.5"
                >
                  <UIcon
                    name="material-symbols:mic"
                    class="text-[14px] text-primary"
                  />
                </div>
              </div>
              <div>
                <p class="text-sm font-semibold text-slate-900 dark:text-white">
                  Alice (You)
                </p>
                <p class="text-xs text-primary">Host • Speaking</p>
              </div>
            </div>
            <div
              class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <button
                class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <UIcon name="material-symbols:more-vert" class="text-[18px]" />
              </button>
            </div>
          </div>
          <!-- Participant Item 2 -->
          <div class="flex items-center justify-between group">
            <div class="flex items-center gap-3">
              <div class="relative">
                <div
                  class="w-10 h-10 rounded-full bg-cover bg-center"
                  data-alt="Bob Smith Avatar"
                  style="
                    background-image: url(&quot;https://lh3.googleusercontent.com/aida-public/AB6AXuAnNWlDe9t1upjAhHykCP0bssEwIAEReADOpcha_tZQoODKCGErU6K9xsF9FHFKQQSJRCmiFfzttNs-4JNKi88ElvMDkBV9LnbCJYvqxUoC8ZMapjt_kRY-yLYp0YeqPJpPkW9G3KJ0y5abbp0PbVxFhQqa-Aci-UCw1pZOcjeJDJ9mb4gSsJL-NOuLT7yR1sWbrWVzom7AiI-e9jsBu9fFgG5lW2XghB8U1xmnruKVO8iM2hX5ESUwq2uKZ_XpiE_Ji_3BzNwLXTdX&quot;);
                  "
                ></div>
              </div>
              <div>
                <p
                  class="text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Bob Smith
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <UIcon
                name="material-symbols:mic-off"
                class="text-[18px] text-slate-400"
              />
              <UIcon
                name="material-symbols:videocam"
                class="text-[18px] text-slate-400"
              />
            </div>
          </div>
          <!-- Participant Item 3 -->
          <div class="flex items-center justify-between group">
            <div class="flex items-center gap-3">
              <div class="relative">
                <div
                  class="w-10 h-10 rounded-full bg-cover bg-center grayscale"
                  data-alt="Charlie Avatar"
                  style="
                    background-image: url(&quot;https://lh3.googleusercontent.com/aida-public/AB6AXuDGNqBLXDGKL4H_CYY3Okgm92d3imu1vn65y_uovhGfbp6Jlpuqfq3BkVeGBM_CoeFvI8VIx7WS0gH9kZSgq-pMicJfCFeEl24SAP9-DwxKzhp2LdYe4xmEUyn_eooKoihlqklfHytigM2BC4b19NCiOvOx0lIrkEjJa6Gi5F2dnxBMuL-HkC0lvoxuWI_ecbj-O0WtSbi0byc2iQKIhbafllrIGGRO6n1HFfIpuW0LSKrptpxiF-z8Ug2akUMkbnnziUcDGpoq35oT&quot;);
                  "
                ></div>
                <div
                  class="absolute -bottom-1 -right-1 bg-white dark:bg-surface-dark rounded-full p-0.5"
                >
                  <UIcon
                    name="material-symbols:mic-off"
                    class="text-[14px] text-danger"
                  />
                </div>
              </div>
              <div>
                <p
                  class="text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Charlie
                </p>
                <p class="text-xs text-slate-400">Muted</p>
              </div>
            </div>
            <div class="flex gap-2">
              <UIcon
                name="material-symbols:mic-off"
                class="text-[18px] text-danger"
              />
              <UIcon
                name="material-symbols:videocam-off"
                class="text-[18px] text-danger"
              />
            </div>
          </div>
        </div>
        <!-- Sidebar Footer (Optional) -->
        <div class="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            class="w-full h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Mute All
          </button>
        </div>
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
const showSidePanel = ref(false);
const tabActive = ref("participants");

const isMuted = ref(false);
const isVideoOff = ref(false);
const isScreenSharing = ref(false);
const isRecording = ref(false);
const hasUnreadMessage = ref(true);

const handleSidePanel = (tab: string) => {
  tab === "chat" && tabActive.value === "chat"
    ? (hasUnreadMessage.value = false)
    : null;

  showSidePanel.value = !showSidePanel.value;
  tabActive.value = tab;
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
</script>

<style scoped></style>
