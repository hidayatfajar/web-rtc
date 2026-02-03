<template>
  <div class="flex flex-col h-full bg-white dark:bg-surface-dark">
    <!-- Chat Header -->
    <div class="p-4 border-b border-slate-100 dark:border-slate-800">
      <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Chat</h3>
      <p class="text-xs text-slate-500 mt-1">
        {{ messages.length }} message{{ messages.length !== 1 ? "s" : "" }}
      </p>
    </div>

    <!-- Messages List -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
      <transition-group name="message" tag="div" class="space-y-4">
        <div
          v-for="message in messages"
          :key="message.id"
          class="flex gap-3"
          :class="{ 'flex-row-reverse': isOwnMessage(message.senderId) }"
        >
          <!-- Avatar -->
          <div class="shrink-0">
            <div
              class="w-8 h-8 rounded-full bg-cover bg-center"
              :style="{
                backgroundImage: `url('${getParticipantAvatar(message.senderId)}')`,
              }"
            ></div>
          </div>

          <!-- Message Content -->
          <div
            class="flex-1 max-w-[75%]"
            :class="{ 'text-right': isOwnMessage(message.senderId) }"
          >
            <div
              class="flex items-baseline gap-2 mb-1"
              :class="{ 'flex-row-reverse': isOwnMessage(message.senderId) }"
            >
              <p class="text-xs font-semibold text-slate-900 dark:text-white">
                {{
                  isOwnMessage(message.senderId) ? "You" : message.senderName
                }}
              </p>
              <p class="text-[10px] text-slate-400">
                {{ formatTime(message.timestamp) }}
              </p>
            </div>
            <div
              class="inline-block px-4 py-2 rounded-2xl"
              :class="
                isOwnMessage(message.senderId)
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm'
              "
            >
              <p class="text-sm wrap-break-words">{{ message.message }}</p>
            </div>
          </div>
        </div>
      </transition-group>

      <!-- Empty State -->
      <transition
        enter-active-class="transition-all duration-300"
        leave-active-class="transition-all duration-300"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="messages.length === 0"
          class="flex flex-col items-center justify-center h-full text-center py-12"
        >
          <div
            class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4"
          >
            <UIcon
              name="material-symbols:chat-bubble-outline"
              class="text-[32px] text-slate-400"
            />
          </div>
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
            No messages yet
          </p>
          <p class="text-xs text-slate-500 mt-1">Start the conversation!</p>
        </div>
      </transition>
    </div>

    <!-- Chat Input -->
    <div class="p-4 border-t border-slate-100 dark:border-slate-800">
      <form @submit.prevent="handleSendMessage" class="flex gap-2">
        <input
          v-model="newMessage"
          type="text"
          placeholder="Type a message..."
          class="flex-1 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <button
          type="submit"
          :disabled="!newMessage.trim()"
          class="px-4 py-2 rounded-lg bg-primary text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <UIcon name="material-symbols:send" class="text-[18px]" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage, Participant } from "~/stores/meeting";

const props = defineProps<{
  messages: ChatMessage[];
  participants: Participant[];
  currentUserId: string;
}>();

const emit = defineEmits<{
  sendMessage: [message: string];
}>();

const newMessage = ref("");
const messagesContainer = ref<HTMLElement | null>(null);

const isOwnMessage = (senderId: string) => {
  return senderId === props.currentUserId;
};

const getParticipantAvatar = (senderId: string) => {
  const participant = props.participants.find((p) => p.id === senderId);
  return participant?.avatar || "";
};

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const handleSendMessage = () => {
  if (newMessage.value.trim()) {
    emit("sendMessage", newMessage.value);
    newMessage.value = "";
    nextTick(() => {
      scrollToBottom();
    });
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// Auto scroll to bottom on new messages
watch(
  () => props.messages.length,
  () => {
    nextTick(() => {
      scrollToBottom();
    });
  },
);

onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped>
.message-enter-active {
  transition: all 0.3s ease-out;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.message-move {
  transition: transform 0.3s ease;
}
</style>
