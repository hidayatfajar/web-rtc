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
      <div class="flex gap-2" @click="handleCopylink">
        <button
          class="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <UIcon name="material-symbols:content-copy" class="text-[18px]" />
          Copy Link
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
      <transition-group name="participant" tag="div" class="space-y-3">
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
              <!-- <div
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
              </div> -->
              <!-- Host Crown Badge -->
              <!-- <div
                v-if="participant.isHost"
                class="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5"
                title="Host"
              >
                <UIcon
                  name="material-symbols:crown"
                  class="text-[14px] text-white"
                />
              </div> -->
              <!-- Co-host Badge -->
              <!-- <div
                v-else-if="participant.isCoHost"
                class="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5"
                title="Co-host"
              >
                <UIcon
                  name="material-symbols:shield-person"
                  class="text-[14px] text-white"
                />
              </div> -->
            </div>
            <div>
              <p
                class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2"
                :class="{ 'text-primary': participant.isSpeaking }"
              >
                {{ participant.name }}
                <span
                  v-if="participant.isHost"
                  class="text-[10px] px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded font-bold uppercase tracking-wide"
                  >Host</span
                >
                <span
                  v-else-if="participant.isCoHost"
                  class="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded font-bold uppercase tracking-wide"
                  >Co-host</span
                >
              </p>
              <p
                class="text-xs"
                :class="
                  participant.isSpeaking ? 'text-primary' : 'text-slate-400'
                "
              >
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
            <!-- v-if="!participant.isYou && (isHost || isCoHost)" -->
            <!-- <UDropdownMenu
              :items="getDropdownItems(participant)"
              :ui="{
                content: 'w-48',
              }"
              @select="(item: any) => handleDropdownSelect(item, participant)"
            >
              <button
                class="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <UIcon name="material-symbols:more-vert" class="text-[18px]" />
              </button>
            </UDropdownMenu> -->
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Footer Actions -->
    <div class="p-4 border-t border-slate-100 dark:border-slate-800">
      <button
        v-if="isYou"
        @click="showRenameDialog = true"
        class="w-full h-10 rounded-lg mb-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold text-sm hover:bg-blue-200 dark:hover:bg-blue-900/30 hover:scale-105 active:scale-95 transition-all duration-200"
      >
        Change Name
      </button>
      <!-- <button
        class="w-full h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all duration-200"
      >
        Mute All
      </button> -->
    </div>
  </div>
  <!-- Rename Dialog -->
  <UModal v-model:open="showRenameDialog" title="Change Your Name">
    <template #body>
      <div class="space-y-1.5">
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
            v-model="newUsername"
            @keyup.enter="handleRename"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <UButton color="neutral" @click="showRenameDialog = false"
          >Cancel</UButton
        >
        <UButton @click="handleRename">Save</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Participant } from "~/stores/meeting";

interface Props {
  participants: Participant[];
  isHost?: boolean;
  isCoHost?: boolean;
  onKick?: (socketId: string) => void;
  onAssignCoHost?: (socketId: string) => void;
  onRemoveCoHost?: (socketId: string) => void;
  onRename?: (newName: string) => void;
}

const toast = useAppToast();
const props = withDefaults(defineProps<Props>(), {
  isHost: false,
  isCoHost: false,
});

const showRenameDialog = ref(false);
const newUsername = ref("");

// Check if any participant is "You"
const isYou = computed(() => props.participants.some((p) => p.isYou));

// Get dropdown items based on participant and permissions
const getDropdownItems = (participant: Participant): DropdownMenuItem[] => {
  const items: DropdownMenuItem[] = [];

  // Only host can assign/remove co-host
  if (props.isHost) {
    if (participant.isCoHost) {
      items.push({
        label: "Remove Co-host",
        icon: "i-lucide-user-minus",
        click: () => props.onRemoveCoHost?.(participant.id),
      });
    } else if (!participant.isHost) {
      items.push({
        label: "Make Co-host",
        icon: "i-lucide-user-plus",
        click: () => props.onAssignCoHost?.(participant.id),
      });
    }
  }

  // Host and co-host can kick (but not host)
  if ((props.isHost || props.isCoHost) && !participant.isHost) {
    items.push({
      label: "Kick",
      icon: "i-lucide-user-x",
      color: "error",
      click: () => props.onKick?.(participant.id),
    });
  }

  console.log('items', items)
  return items;
};

const handleDropdownSelect = (
  item: DropdownMenuItem,
  participant: Participant,
) => {
  item.click?.();
};

const handleRename = () => {
  if (newUsername.value.trim()) {
    props.onRename?.(newUsername.value.trim());
    showRenameDialog.value = false;
    newUsername.value = "";
  }
};

const handleCopylink = () => {
  const meetingLink = window.location.href;
  navigator.clipboard
    .writeText(meetingLink)
    .then(() => {
      console.log("[ParticipantList] ✅ Meeting link copied to clipboard");
      // Optionally, show a toast notification here
      toast.success("Meeting link copied to clipboard!");
    })
    .catch((err) => {
      console.error(
        "[ParticipantList] ❌ Failed to copy meeting link:",
        err,
      );
      toast.error("Failed to copy meeting link. Please try again.");
    });
};
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
