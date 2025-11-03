import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform, ActivityIndicator, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { X } from 'lucide-react-native';
import { colors, spacing } from '../../../lib/design-system';
import { WebView } from 'react-native-webview';

interface PDFViewerProps {
  uri: string;
  title: string;
  onClose: () => void;
}

export function PDFViewer({ uri, title, onClose }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const isWeb = Platform.OS === 'web';
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoadTimedOut(true), 6000);
    return () => clearTimeout(timer);
  }, [uri]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.pdfContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Loading PDF...</Text>
          </View>
        )}
        {isWeb ? (
          // Web: use WebView (react-native-webview has a web shim that renders an iframe)
          <WebView
            source={{ uri }}
            style={styles.webview}
            onLoadEnd={() => setLoading(false)}
            onError={() => setLoading(false)}
            startInLoadingState
          />
        ) : (
          // Native (Expo Go compatible): use Google viewer in a WebView, with fallback to open externally
          <WebView
            source={{ uri: `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(uri)}` }}
            style={styles.webview}
            onLoadEnd={() => setLoading(false)}
            onError={() => setLoading(false)}
            startInLoadingState
          />
        )}

        {!isWeb && (loadTimedOut || !loading) && (
          <View style={styles.fallbackBar}>
            <TouchableOpacity onPress={() => Linking.openURL(uri)}>
              <Text style={styles.fallbackLink}>Open in browser</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={{ height: insets.bottom, backgroundColor: colors.surface.primary }} />
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface.primary,
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
  pdfContainer: {
    flex: 1,
    backgroundColor: colors.neutral[100],
  },
  webview: {
    flex: 1,
    backgroundColor: colors.neutral[100],
  },
  fallbackBar: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#ffffffcc',
    borderRadius: 12,
  },
  fallbackLink: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    zIndex: 1,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text.secondary,
  },
});
