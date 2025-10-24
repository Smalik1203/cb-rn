import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { X } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { colors, spacing, borderRadius } from '@/lib/design-system';

interface VideoPlayerProps {
  uri: string;
  title: string;
  onClose: () => void;
}

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be') || getYouTubeVideoId(url) !== null;
}

export function VideoPlayer({ uri, title, onClose }: VideoPlayerProps) {
  const video = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<AVPlaybackStatus>();

  const isYouTube = isYouTubeUrl(uri);
  const youtubeVideoId = isYouTube ? getYouTubeVideoId(uri) : null;

  const youtubeEmbedUrl = youtubeVideoId
    ? `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&playsinline=1`
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.videoContainer}>
        {isYouTube && youtubeEmbedUrl ? (
          <WebView
            source={{ uri: youtubeEmbedUrl }}
            style={styles.webview}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
          />
        ) : (
          <Video
            ref={video}
            source={{ uri }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={status => setStatus(() => status)}
          />
        )}
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
  webview: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.5,
    backgroundColor: colors.neutral[900],
  },
});
