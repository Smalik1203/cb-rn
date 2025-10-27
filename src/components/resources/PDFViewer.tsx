import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform, ActivityIndicator } from 'react-native';
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

  const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(uri)}&embedded=true`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
        <WebView
          source={{ uri: googleDocsUrl }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          onError={() => setLoading(false)}
          startInLoadingState
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
  pdfContainer: {
    flex: 1,
    backgroundColor: colors.neutral[100],
  },
  webview: {
    flex: 1,
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
