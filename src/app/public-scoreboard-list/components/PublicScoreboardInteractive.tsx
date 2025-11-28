'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { scoreboardService } from '../../../services/scoreboardService';
import Icon from '@/components/ui/AppIcon';
import PublicScoreboardCard from './PublicScoreboardCard';
import Header from '../../../components/common/Header';

interface Scoreboard {
  id: string;
  title: string;
  description: string;
  entryCount?: number;
  createdAt: string;
  isPublic: boolean;
}

const PublicScoreboardInteractive = () => {
  const router = useRouter();
  const [scoreboards, setScoreboards] = useState<Scoreboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  useEffect(() => {
    loadPublicScoreboards();
  }, []);

  const loadPublicScoreboards = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await scoreboardService.getPublicScoreboards();
      
      if (error) {
        setError(error.message);
      } else {
        setScoreboards(data || []);
      }
    } catch (err) {
      setError('Failed to load scoreboards');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedScoreboards = useMemo(() => {
    let filtered = scoreboards;

    // Filter by search query
    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (scoreboard) =>
          scoreboard?.title?.toLowerCase()?.includes(query) ||
          scoreboard?.description?.toLowerCase()?.includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'title') {
        return (a?.title || '').localeCompare(b?.title || '');
      } else if (sortBy === 'newest') {
        return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
      } else {
        return new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime();
      }
    });

    return sorted;
  }, [scoreboards, searchQuery, sortBy]);

  return (
    <>
      <Header isAuthenticated={false} />
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="TrophyIcon" size={32} className="text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Public Scoreboards</h1>
            </div>
            <p className="text-muted-foreground">Browse and view public scoreboards from the community</p>
          </div>

          {/* Search and filters */}
          <div className="mb-6 flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Icon name="MagnifyingGlassIcon" size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scoreboards..."
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">By Title</option>
            </select>
          </div>

          {/* Stats Overview */}
          {!loading && !error && (
            <div className="mb-6 flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Icon name="ChartBarIcon" size={16} />
                <span>{scoreboards.length} public scoreboards</span>
              </div>
              {filteredAndSortedScoreboards.length !== scoreboards.length && (
                <div className="flex items-center space-x-2">
                  <Icon name="FunnelIcon" size={16} />
                  <span>Showing {filteredAndSortedScoreboards.length} of {scoreboards.length}</span>
                </div>
              )}
            </div>
          )}

          {/* Scoreboards grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading scoreboards...</p>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-center space-x-2">
              <Icon name="ExclamationTriangleIcon" size={20} />
              <span>{error}</span>
            </div>
          ) : filteredAndSortedScoreboards.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="InboxIcon" size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No scoreboards found</p>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search query' : 'No public scoreboards available yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedScoreboards.map((scoreboard) => (
                <PublicScoreboardCard key={scoreboard?.id} scoreboard={scoreboard} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PublicScoreboardInteractive;