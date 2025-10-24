import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { X } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { colors, spacing } from '@/lib/design-system';

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

  const isYouTube = isYouTubeUrl(uri);
  const youtubeVideoId = isYouTube ? getYouTubeVideoId(uri) : null;

  const youtubeEmbedUrl = youtubeVideoId
    ? `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0&playsinline=1&controls=1&rel=0`
    : null;

  const { width, height } = Dimensions.get('window');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.videoWrapper}>
        {isYouTube && youtubeEmbedUrl ? (
          <WebView
            source={{ uri: youtubeEmbedUrl }}
            style={[styles.video, { width, height: height - 100 }]}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
          />
        ) : (
          <Video
            ref={video}
            source={{ uri }}
            style={[styles.video, { width, height: height - 100 }]}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[900],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    height: 60,
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
  videoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[900],
  },
  video: {
    backgroundColor: colors.neutral[900],
  },
});
