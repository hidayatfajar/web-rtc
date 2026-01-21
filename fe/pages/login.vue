<template>
  <div>
    <div
      class="font-primary bg-slate-50 dark:bg-slate-900 bg-tech-grid min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-200"
    >
      <!-- Brand / Context Indicator -->
      <div
        class="absolute top-6 left-6 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-default"
      >
        <UIcon name="material-symbols:hub" class="text-primary text-2xl" />
        <span
          class="font-bold text-slate-900 dark:text-white text-sm tracking-wide"
          >LetMeeting<span class="font-normal text-slate-500">.io</span></span
        >
      </div>
      <!-- Main Card Container -->
      <main class="w-full max-w-120 relative z-10">
        <!-- Card -->
        <div
          class="bg-white dark:bg-slate-800 rounded-2xl shadow-card overflow-hidden transition-all duration-300 relative"
        >
          <!-- Top Loading Bar (Simulated decorative element) -->
          <div
            class="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary/20 to-transparent"
          ></div>
          <!-- Card Header -->
          <div class="px-8 pt-10 pb-6 text-center">
            <div
              class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-primary mb-6 shadow-sm"
            >
              <UIcon name="material-symbols:videocam" class="text-3xl" />
            </div>
            <h1
              class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2"
            >
              Let Meeting
            </h1>
            <p class="text-slate-500 dark:text-slate-400 text-base font-normal">
              Connect instantly, securely.
            </p>
          </div>
          <!-- Form Section -->
          <div class="px-8 pb-8 space-y-5">
            <!-- Name Input -->
            <div class="space-y-1.5">
              <label
                class="block text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1"
                for="username"
                >Your Name</label
              >
              <div class="relative group">
                <div
                  class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                >
                  <UIcon
                    name="material-symbols:person"
                    class="text-slate-400 group-focus-within:text-primary transition-colors text-[20px]"
                  ></UIcon>
                </div>
                <input
                  class="block w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all sm:text-sm font-medium shadow-sm"
                  id="username"
                  placeholder="Enter your display name"
                  type="text"
                />
              </div>
            </div>
            <!-- Room ID Input -->
            <div class="space-y-1.5">
              <label
                class="block text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1"
                for="roomid"
                >Room ID</label
              >
              <div class="relative group">
                <div
                  class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
                >
                  <UIcon
                    name="material-symbols:keyboard"
                    class="text-slate-400 group-focus-within:text-primary transition-colors text-[20px]"
                  ></UIcon>
                </div>
                <input
                  class="block w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all sm:text-sm font-medium shadow-sm"
                  id="roomid"
                  placeholder="e.g. 123-456-789"
                  type="text"
                />
              </div>
            </div>
            <!-- Join Button -->
            <button
              class="w-full flex items-center justify-center gap-2 bg-linear-to-b from-primary to-[#105ac0] hover:from-[#1766cc] hover:to-[#0d4a9e] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all duration-200 mt-2 group border-t border-white/20"
            >
              <span>Join Meeting</span>
              <UIcon
                name="material-symbols:arrow-forward"
                class="text-[20px] group-hover:translate-x-0.5 transition-transform"
              />
            </button>
            <!-- Permissions Hint -->
            <p
              class="text-xs text-center text-slate-400 dark:text-slate-500 pt-1"
            >
              Wait for the camera permission prompt after joining.
            </p>
          </div>
          <!-- Footer Features -->
          <div
            class="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/50 px-8 py-5"
          >
            <div
              class="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              <div
                class="flex flex-col items-center gap-1.5 group cursor-help transition-colors hover:text-slate-700 dark:hover:text-slate-200"
              >
                <div
                  class="p-1.5 rounded-full bg-white border border-slate-200 shadow-sm group-hover:border-primary/30 transition-colors"
                >
                  <UIcon
                    name="material-symbols:present-to-all"
                    class="text-primary text-[18px] block icon-filled"
                  />
                </div>
                <span>Screen Share</span>
              </div>
              <div
                class="flex flex-col items-center gap-1.5 group cursor-help transition-colors hover:text-slate-700 dark:hover:text-slate-200"
              >
                <div
                  class="p-1.5 rounded-full bg-white border border-slate-200 shadow-sm group-hover:border-rose-500/30 transition-colors"
                >
                  <UIcon
                    name="material-symbols:radio-button-checked"
                    class="text-[18px] text-rose-500 block"
                  />
                </div>
                <span>Recording</span>
              </div>
              <div
                class="flex flex-col items-center gap-1.5 group cursor-help transition-colors hover:text-slate-700 dark:hover:text-slate-200"
              >
                <div
                  class="p-1.5 rounded-full bg-white border border-slate-200 shadow-sm group-hover:border-emerald-500/30 transition-colors"
                >
                  <UIcon
                    name="material-symbols:bolt"
                    class="text-[18px] text-emerald-500 block"
                  />
                </div>
                <span>Real-time</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Ambient Glow for distinctiveness -->
        <div
          class="absolute -inset-4 bg-linear-to-tr from-blue-400/20 to-purple-400/20 rounded-4xl blur-2xl -z-10 opacity-60 pointer-events-none"
        ></div>
      </main>
      <!-- Footer -->
      <footer class="absolute bottom-6 w-full text-center pointer-events-none">
        <p
          class="text-[10px] uppercase tracking-widest text-slate-300 font-semibold"
        >
          Secure • Encrypted • P2P
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.font-primary {
  font-family: "Inter", sans-serif;
}
.material-symbols-outlined {
  font-variation-settings:
    "FILL" 0,
    "wght" 400,
    "GRAD" 0,
    "opsz" 24;
}
.icon-filled {
  font-variation-settings:
    "FILL" 1,
    "wght" 400,
    "GRAD" 0,
    "opsz" 24;
}
/* Subtle grid pattern for technical feel, avoiding generic gradients */
.bg-tech-grid {
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 24px 24px;
}
.dark .bg-tech-grid {
  background-image: radial-gradient(#334155 1px, transparent 1px);
}
</style>
