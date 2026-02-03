const roomStates = {};

export function getRoomState(roomId) {
  if (!roomStates[roomId]) {
    roomStates[roomId] = {
      whoIsSharing: null,
      whoIsRecording: null,
      host: null, // Host socketId
      coHosts: [], // Array of co-host socketIds
      participants: {}, // { socketId: { username, socketId, isHost, isCoHost } }
      streamTypes: {}, // { socketId: { cameraStreamId, screenStreamId } }
    };
  }
  return roomStates[roomId];
}

export function addParticipant(roomId, socketId, username) {
  const roomState = getRoomState(roomId);
  
  // set as host if first participant
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

export function removeParticipant(roomId, socketId) {
  const roomState = getRoomState(roomId);
  delete roomState.participants[socketId];
  
  if (roomState.whoIsSharing === socketId) {
    roomState.whoIsSharing = null;
  }
  if (roomState.whoIsRecording === socketId) {
    roomState.whoIsRecording = null;
  }
  
  // transfer host jika host keluar
  if (roomState.host === socketId) {
    const remainingParticipants = Object.keys(roomState.participants);
    if (remainingParticipants.length > 0) {
      // transfer ke co-host pertama atau participant pertama
      const newHost = roomState.coHosts.length > 0 
        ? roomState.coHosts[0] 
        : remainingParticipants[0];
      roomState.host = newHost;
      
      // update host status
      if (roomState.participants[newHost]) {
        roomState.participants[newHost].isHost = true;
      }
      
      // remove new host from co-hosts if they were co-host
      roomState.coHosts = roomState.coHosts.filter(id => id !== newHost);
    } else {
      roomState.host = null;
    }
  }
  
  // remove from co-hosts if they were co-host
  roomState.coHosts = roomState.coHosts.filter(id => id !== socketId);
  
  return roomState.participants;
}

export function getParticipants(roomId) {
  const roomState = getRoomState(roomId);
  return Object.values(roomState.participants);
}

export function setSharing(roomId, socketId) {
  const roomState = getRoomState(roomId);
  roomState.whoIsSharing = socketId;
}

export function clearSharing(roomId, socketId) {
  const roomState = getRoomState(roomId);
  if (roomState.whoIsSharing === socketId) {
    roomState.whoIsSharing = null;
  }
}

export function setRecording(roomId, socketId) {
  const roomState = getRoomState(roomId);
  roomState.whoIsRecording = socketId;
}

export function clearRecording(roomId, socketId) {
  const roomState = getRoomState(roomId);
  if (roomState.whoIsRecording === socketId) {
    roomState.whoIsRecording = null;
  }
}

export function setCoHost(roomId, socketId) {
  const roomState = getRoomState(roomId);
  if (!roomState.coHosts.includes(socketId)) {
    roomState.coHosts.push(socketId);
  }
  if (roomState.participants[socketId]) {
    roomState.participants[socketId].isCoHost = true;
  }
}

export function removeCoHost(roomId, socketId) {
  const roomState = getRoomState(roomId);
  roomState.coHosts = roomState.coHosts.filter(id => id !== socketId);
  if (roomState.participants[socketId]) {
    roomState.participants[socketId].isCoHost = false;
  }
}

export function renameParticipant(roomId, socketId, newUsername) {
  const roomState = getRoomState(roomId);
  if (roomState.participants[socketId]) {
    roomState.participants[socketId].username = newUsername;
  }
  return roomState.participants[socketId];
}

export function isHostOrCoHost(roomId, socketId) {
  const roomState = getRoomState(roomId);
  return roomState.host === socketId || roomState.coHosts.includes(socketId);
}

export function getHost(roomId) {
  const roomState = getRoomState(roomId);
  return roomState.host;
}

export function cleanupRoom(roomId) {
  const roomState = roomStates[roomId];
  if (roomState && Object.keys(roomState.participants).length === 0) {
    delete roomStates[roomId];
  }
}

export function setStreamType(roomId, socketId, streamId, streamType) {
  const roomState = getRoomState(roomId);
  if (!roomState.streamTypes[socketId]) {
    roomState.streamTypes[socketId] = {};
  }
  if (streamType === 'camera') {
    roomState.streamTypes[socketId].cameraStreamId = streamId;
  } else if (streamType === 'screen') {
    roomState.streamTypes[socketId].screenStreamId = streamId;
  }
}

export function getAllStreamTypes(roomId) {
  const roomState = getRoomState(roomId);
  return roomState.streamTypes || {};
}
