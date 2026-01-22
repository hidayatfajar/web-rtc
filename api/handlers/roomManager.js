/**
 * Room Manager - Handles room state and participant tracking
 */

// Track room states (who is sharing, who is recording, participants with usernames)
const roomStates = {};

/**
 * Get or initialize room state
 */
export function getRoomState(roomId) {
  if (!roomStates[roomId]) {
    roomStates[roomId] = {
      whoIsSharing: null,
      whoIsRecording: null,
      host: null, // Host socketId
      coHosts: [], // Array of co-host socketIds
      participants: {}, // { socketId: { username, socketId, isHost, isCoHost } }
    };
  }
  return roomStates[roomId];
}

/**
 * Add participant to room
 */
export function addParticipant(roomId, socketId, username) {
  const roomState = getRoomState(roomId);
  
  // Set as host if first participant
  const isFirstParticipant = Object.keys(roomState.participants).length === 0;
  if (isFirstParticipant) {
    roomState.host = socketId;
  }
  
  roomState.participants[socketId] = {
    socketId,
    username: username || `User-${socketId.substring(0, 6)}`,
    isHost: roomState.host === socketId,
    isCoHost: roomState.coHosts.includes(socketId),
  };
  return roomState.participants;
}

/**
 * Remove participant from room
 */
export function removeParticipant(roomId, socketId) {
  const roomState = getRoomState(roomId);
  delete roomState.participants[socketId];
  
  // Clean up if this user was sharing or recording
  if (roomState.whoIsSharing === socketId) {
    roomState.whoIsSharing = null;
  }
  if (roomState.whoIsRecording === socketId) {
    roomState.whoIsRecording = null;
  }
  
  // Transfer host if host leaves
  if (roomState.host === socketId) {
    const remainingParticipants = Object.keys(roomState.participants);
    if (remainingParticipants.length > 0) {
      // Transfer to first co-host if exists, otherwise first participant
      const newHost = roomState.coHosts.length > 0 
        ? roomState.coHosts[0] 
        : remainingParticipants[0];
      roomState.host = newHost;
      
      // Update new host status
      if (roomState.participants[newHost]) {
        roomState.participants[newHost].isHost = true;
      }
      
      // Remove new host from co-hosts if they were co-host
      roomState.coHosts = roomState.coHosts.filter(id => id !== newHost);
    } else {
      roomState.host = null;
    }
  }
  
  // Remove from co-hosts if they were co-host
  roomState.coHosts = roomState.coHosts.filter(id => id !== socketId);
  
  return roomState.participants;
}

/**
 * Get all participants in a room
 */
export function getParticipants(roomId) {
  const roomState = getRoomState(roomId);
  return Object.values(roomState.participants);
}

/**
 * Set who is sharing in the room
 */
export function setSharing(roomId, socketId) {
  const roomState = getRoomState(roomId);
  roomState.whoIsSharing = socketId;
}

/**
 * Clear sharing state
 */
export function clearSharing(roomId, socketId) {
  const roomState = getRoomState(roomId);
  if (roomState.whoIsSharing === socketId) {
    roomState.whoIsSharing = null;
  }
}

/**
 * Set who is recording in the room
 */
export function setRecording(roomId, socketId) {
  const roomState = getRoomState(roomId);
  roomState.whoIsRecording = socketId;
}

/**
 * Clear recording state
 */
export function clearRecording(roomId, socketId) {
  const roomState = getRoomState(roomId);
  if (roomState.whoIsRecording === socketId) {
    roomState.whoIsRecording = null;
  }
}

/**
 * Set co-host
 */
export function setCoHost(roomId, socketId) {
  const roomState = getRoomState(roomId);
  if (!roomState.coHosts.includes(socketId)) {
    roomState.coHosts.push(socketId);
  }
  if (roomState.participants[socketId]) {
    roomState.participants[socketId].isCoHost = true;
  }
}

/**
 * Remove co-host
 */
export function removeCoHost(roomId, socketId) {
  const roomState = getRoomState(roomId);
  roomState.coHosts = roomState.coHosts.filter(id => id !== socketId);
  if (roomState.participants[socketId]) {
    roomState.participants[socketId].isCoHost = false;
  }
}

/**
 * Rename participant
 */
export function renameParticipant(roomId, socketId, newUsername) {
  const roomState = getRoomState(roomId);
  if (roomState.participants[socketId]) {
    roomState.participants[socketId].username = newUsername;
  }
  return roomState.participants[socketId];
}

/**
 * Check if user is host or co-host
 */
export function isHostOrCoHost(roomId, socketId) {
  const roomState = getRoomState(roomId);
  return roomState.host === socketId || roomState.coHosts.includes(socketId);
}

/**
 * Get host socketId
 */
export function getHost(roomId) {
  const roomState = getRoomState(roomId);
  return roomState.host;
}

/**
 * Clean up empty room
 */
export function cleanupRoom(roomId) {
  const roomState = roomStates[roomId];
  if (roomState && Object.keys(roomState.participants).length === 0) {
    delete roomStates[roomId];
  }
}
