import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import {
  createAgoraRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
  ClientRoleType,
  VideoSourceType,
} from 'react-native-agora';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const config = {
  appId: "8d403cacccf34fb9aee2fa46cb1b17ac",
  token: "007eJxTYLC0/3HY3+UH64E6o5iph1M2Hnu5WEeb+8zZZVUi4laLtAIUGCxSTAyMkxOTk5PTjE3SkiwTU1ON0hJNzJKTDJMMzROT/94xTG8IZGRw1NzMzMgAgSA+C0NJanEJAwMAZHkgKA==",
  channelName: "test",
};

const VideoCall = ({ onCallLeave }) => {
  const engineRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('CONNECTING');

  const initEngine = async () => {
    try {
      console.log('Creating Agora Engine...');
      const agoraEngine = createAgoraRtcEngine();
      
      console.log('Initializing Engine with AppID:', config.appId);
      await agoraEngine.initialize({
        appId: config.appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      await agoraEngine.enableVideo();
      await agoraEngine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      agoraEngine.addListener('onJoinChannelSuccess', (connection, elapsed) => {
        console.log('Successfully joined channel:', connection);
        setJoined(true);
        setConnectionState('CONNECTED');
      });

      agoraEngine.addListener('onError', (err) => {
        console.error('Agora Error:', err);
        setError(`Error code: ${err}`);
      });

      agoraEngine.addListener('onUserJoined', (connection, uid) => {
        console.log('Remote user joined:', uid);
        setRemoteUsers(prev => [...new Set([...prev, uid])]);
      });

      agoraEngine.addListener('onUserOffline', (connection, uid) => {
        console.log('Remote user left:', uid);
        setRemoteUsers(prev => prev.filter(id => id !== uid));
      });

      engineRef.current = agoraEngine;
      return true;
    } catch (e) {
      console.error('Engine init error:', e);
      setError('Failed to initialize: ' + e.message);
      return false;
    }
  };

  const joinChannel = async () => {
    if (!engineRef.current) return;

    try {
      const options = {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishCameraTrack: true,
        publishMicrophoneTrack: true,
      };

      console.log('Joining channel:', config.channelName);
      await engineRef.current.joinChannel(
        config.token,
        config.channelName,
        0,
        options
      );
    } catch (err) {
      console.error('Join channel error:', err);
      setError('Failed to join channel: ' + err.message);
    }
  };

  const setupCall = async () => {
    try {
      if (Platform.OS === 'android') {
        const cameraResult = await request(PERMISSIONS.ANDROID.CAMERA);
        const micResult = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
        
        if (cameraResult !== RESULTS.GRANTED || micResult !== RESULTS.GRANTED) {
          throw new Error('Permission for camera and microphone required');
        }
      }

      if (await initEngine()) {
        await joinChannel();
      }
    } catch (err) {
      console.error('Setup error:', err);
      setError('Setup error: ' + err.message);
    }
  };

  useEffect(() => {
    setupCall();

    return () => {
      if (engineRef.current) {
        engineRef.current.leaveChannel();
        engineRef.current.release();
      }
    };
  }, []);

  const retryConnection = () => {
    setError(null);
    setConnectionState('CONNECTING');
    if (engineRef.current) {
      engineRef.current.leaveChannel();
    }
    setupCall();
  };

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={retryConnection}
          >
            <Text style={styles.buttonText}>Reload</Text>
          </TouchableOpacity>
        </View>
      ) : !joined ? (
        <View style={styles.centerContainer}>
          <Text style={styles.statusText}>Connecting... ({connectionState})</Text>
        </View>
      ) : (
        <>
          <View style={styles.videoContainer}>
            {remoteUsers.length > 0 ? (
              <>
                {/* Big Video */}
                <View style={styles.mainVideoContainer}>
                  <RtcSurfaceView
                    style={styles.fullscreenVideo}
                    canvas={{
                      uid: remoteUsers[0],
                      renderMode: 1,
                    }}
                  />
                  <Text style={styles.mainVideoLabel}>User</Text>
                </View>
                {/* Small Video */}
                <View style={styles.pipVideoContainer}>
                  <RtcSurfaceView
                    style={styles.pipVideo}
                    canvas={{
                      uid: 0,
                      renderMode: 1,
                      mirrorMode: 1,
                    }}
                  />
                  <Text style={styles.pipVideoLabel}>Me</Text>
                </View>
              </>
            ) : (
              <View style={styles.mainVideoContainer}>
                <RtcSurfaceView
                  style={styles.fullscreenVideo}
                  canvas={{
                    uid: 0,
                    renderMode: 1,
                    mirrorMode: 1,
                  }}
                />
                <Text style={styles.mainVideoLabel}>Me</Text>
              </View>
            )}
          </View>
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonOff]}
              onPress={() => {
                engineRef.current?.muteLocalAudioStream(!isMuted);
                setIsMuted(!isMuted);
              }}
            >
              <Text style={styles.buttonText}>
                {isMuted ? 'MIC ON' : 'MIC OFF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, !isVideoEnabled && styles.controlButtonOff]}
              onPress={() => {
                engineRef.current?.enableLocalVideo(!isVideoEnabled);
                setIsVideoEnabled(!isVideoEnabled);
              }}
            >
              <Text style={styles.buttonText}>
                {isVideoEnabled ? 'CAM OFF' : 'CAM ON'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={() => {
                engineRef.current?.leaveChannel();
                onCallLeave();
              }}
            >
              <Text style={styles.buttonText}>END CALL</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    fontSize: 18,
    color: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  mainVideoContainer: {
    flex: 1,
  },
  fullscreenVideo: {
    flex: 1,
    backgroundColor: '#424242',
  },
  pipVideoContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  pipVideo: {
    flex: 1,
    backgroundColor: '#424242',
  },
  mainVideoLabel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
    color: '#fff',
    fontSize: 16,
  },
  pipVideoLabel: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
    borderRadius: 4,
    color: '#fff',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  controlButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  controlButtonOff: {
    backgroundColor: '#555',
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VideoCall;