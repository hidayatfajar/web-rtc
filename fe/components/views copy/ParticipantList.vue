<template>
  <div class="flex flex-col h-full">
    <!-- Invite Block -->
    <div
      class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 mb-4 mx-4 mt-4"
    >
      <p
        class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3"
      >
        Add people
      </p>
      <div class="flex gap-2">
        <button
          class="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <UIcon name="material-symbols:content-copy" class="text-[18px]" />
          Copy Link
        </button>
        <button
          class="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <UIcon name="material-symbols:mail" class="text-[18px]" />
          Email
        </button>
      </div>
    </div>

    <!-- Participants List -->
    <div class="flex-1 overflow-y-auto px-4 flex flex-col gap-4">
      <p
        class="text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-white dark:bg-surface-dark py-2"
      >
        In Call ({{ participants.length }})
      </p>

      <!-- Participant Items -->
      <transition-group
        name="participant"
        tag="div"
        class="space-y-3"
      >
        <div
          v-for="participant in participants"
          :key="participant.id"
          class="flex items-center justify-between group"
        >
        <div class="flex items-center gap-3">
          <div class="relative">
            <div
              class="w-10 h-10 rounded-full bg-cover bg-center"
              :class="{
                'ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-surface-dark':
                  participant.isSpeaking,
                // grayscale: participant.isVideoOff,
              }"
              :style="{
                backgroundImage: `url('${participant.avatar}')`,
              }"
            ></div>
            <div
              v-if="!participant.isMuted || participant.isSpeaking"
              class="absolute -bottom-1 -right-1 bg-white dark:bg-surface-dark rounded-full p-0.5"
            >
              <UIcon
                :name="
                  participant.isMuted
                    ? 'material-symbols:mic-off'
                    : 'material-symbols:mic'
                "
                :class="
                  participant.isMuted
                    ? 'text-danger'
                    : participant.isSpeaking
                      ? 'text-primary'
                      : 'text-slate-400'
                "
                class="text-[14px]"
              />
            </div>
          </div>
          <div>
            <p
              class="text-sm font-semibold text-slate-900 dark:text-white"
              :class="{ 'text-primary': participant.isSpeaking }"
            >
              {{ participant.name }}
            </p>
            <p class="text-xs" :class="participant.isSpeaking ? 'text-primary' : 'text-slate-400'">
              <span v-if="participant.isHost">Host</span>
              <span v-if="participant.isHost && participant.isSpeaking"> • </span>
              <span v-if="participant.isSpeaking">Speaking</span>
              <span v-else-if="participant.isMuted">Muted</span>
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <UIcon
            :name="
              participant.isMuted
                ? 'material-symbols:mic-off'
                : 'material-symbols:mic'
            "
            :class="participant.isMuted ? 'text-danger' : 'text-slate-400'"
            class="text-[18px]"
          />
          <UIcon
            :name="
              participant.isVideoOff
                ? 'material-symbols:videocam-off'
                : 'material-symbols:videocam'
            "
            :class="participant.isVideoOff ? 'text-danger' : 'text-slate-400'"
            class="text-[18px]"
          />
          <button
            v-if="!participant.isYou"
            class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <UIcon name="material-symbols:more-vert" class="text-[18px]" />
          </button>
        </div>
      </div>
      </transition-group>
    </div>

    <!-- Footer Actions -->
    <div class="p-4 border-t border-slate-100 dark:border-slate-800">
      <button
        class="w-full h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all duration-200"
      >
        Mute All
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Participant } from '~/stores/meeting'

const props = defineProps<{
  participants: Participant[]
}>()
</script>

<style scoped>
.participant-enter-active {
  transition: all 0.3s ease-out;
}

.participant-leave-active {
  transition: all 0.3s ease-in;
  position: absolute;
}

.participant-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.participant-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.participant-move {
  transition: transform 0.3s ease;
}
</style>
