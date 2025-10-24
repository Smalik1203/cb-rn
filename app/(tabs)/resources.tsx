import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text } from 'react-native-paper';
import { BookOpen, FileText, Video as VideoIcon, ExternalLink } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '@/lib/design-system';
import { useProfile } from '@/src/hooks/useProfile';
import { useAllResources } from '@/src/hooks/useResources';
import { Card, LoadingView, ErrorView, EmptyState } from '@/src/components/ui';
import { VideoPlayer } from '@/src/components/resources/VideoPlayer';
import { PDFViewer } from '@/src/components/resources/PDFViewer';
import { LearningResource } from '@/src/services/api';

export default function ResourcesScreen() {
  const { data: profile } = useProfile();
  const { data: resources, isLoading, error } = useAllResources(profile?.school_code || undefined);
  const [selectedResource, setSelectedResource] = useState<LearningResource | null>(null);
  const [viewerType, setViewerType] = useState<'video' | 'pdf' | null>(null);

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
      case 'document':
        return <FileText size={20} color={colors.error[600]} />;
      case 'video':
        return <VideoIcon size={20} color={colors.primary[600]} />;
      default:
        return <BookOpen size={20} color={colors.info[600]} />;
    }
  };

  const getResourceColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
      case 'document':
        return colors.error[50];
      case 'video':
        return colors.primary[50];
      default:
        return colors.info[50];
    }
  };

  const handleOpenResource = (resource: LearningResource) => {
    if (!resource.content_url) return;

    const type = resource.resource_type.toLowerCase();

    if (type === 'video') {
      setSelectedResource(resource);
      setViewerType('video');
    } else if (type === 'pdf' || type === 'document') {
      setSelectedResource(resource);
      setViewerType('pdf');
    }
  };

  const handleCloseViewer = () => {
    setSelectedResource(null);
    setViewerType(null);
  };

  if (isLoading) {
    return <LoadingView message="Loading resources..." />;
  }

  if (error) {
    return <ErrorView message={error.message} />;
  }

  if (!resources || resources.length === 0) {
    return (
      <EmptyState
        title="No Resources"
        message="No learning resources available yet"
        icon={<BookOpen size={64} color={colors.neutral[300]} />}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <BookOpen size={24} color={colors.info[600]} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Learning Resources</Text>
          <Text style={styles.headerSubtitle}>{resources.length} resources available</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {resources.map((resource) => (
          <Card key={resource.id} style={styles.resourceCard}>
            <TouchableOpacity
              onPress={() => handleOpenResource(resource)}
              activeOpacity={0.7}
              disabled={!resource.content_url}
            >
              <View style={styles.resourceHeader}>
                <View style={[styles.resourceIcon, { backgroundColor: getResourceColor(resource.resource_type) }]}>
                  {getResourceIcon(resource.resource_type)}
                </View>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                  <Text style={styles.resourceType}>{resource.resource_type.toUpperCase()}</Text>
                </View>
                {resource.content_url && (
                  <ExternalLink size={20} color={colors.text.tertiary} />
                )}
              </View>
              {resource.description && (
                <Text style={styles.resourceDescription}>{resource.description}</Text>
              )}
              <View style={styles.resourceFooter}>
                <Text style={styles.resourceDate}>
                  {new Date(resource.created_at).toLocaleDateString()}
                </Text>
                {resource.file_size && (
                  <Text style={styles.resourceSize}>
                    {(resource.file_size / 1024).toFixed(2)} KB
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>

      <Modal
        visible={!!selectedResource && !!viewerType}
        animationType="slide"
        onRequestClose={handleCloseViewer}
      >
        {selectedResource && viewerType === 'video' && selectedResource.content_url && (
          <VideoPlayer
            uri={selectedResource.content_url}
            title={selectedResource.title}
            onClose={handleCloseViewer}
          />
        )}
        {selectedResource && viewerType === 'pdf' && selectedResource.content_url && (
          <PDFViewer
            uri={selectedResource.content_url}
            title={selectedResource.title}
            onClose={handleCloseViewer}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  header: {
    backgroundColor: colors.surface.primary,
    padding: spacing.lg,
    paddingTop: spacing.xl + 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.info[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  scrollView: {
    flex: 1,
    padding: spacing.md,
  },
  resourceCard: {
    marginBottom: spacing.md,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  resourceType: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.medium,
  },
  resourceDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  resourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  resourceDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  resourceSize: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
});
