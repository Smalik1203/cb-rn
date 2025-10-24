import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Play, Pause, X } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '@/lib/design-system';

interface VideoPlayerProps {
  uri: string;
  title: string;
  onClose: () => void;
}

export function VideoPlayer({ uri, title, onClose }: VideoPlayerProps) {
  const video = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<AVPlaybackStatus>();

  const handlePlayPause = async () => {
    if (!video.current) return;

    if (isPlaying) {
      await video.current.pauseAsync();
    } else {
      await video.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.videoContainer}>
        <Video
          ref={video}
          source={{ uri }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={status => setStatus(() => status)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  closeButton: {
    padding: spacing.xs,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[900],
  },
  video: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.5,
  },
});
