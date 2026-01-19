import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { fetchLeaderboard, simulateGameplay } from '../services/api';
import SkeletonCard from '../components/SkeletonCard';

export default function LeaderboardScreen() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [offset, setOffset] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState(null);

    const LIMIT = 50;

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async (reset = true) => {
        try {
            setError(null);
            const currentOffset = reset ? 0 : offset;

            const data = await fetchLeaderboard(LIMIT, currentOffset);

            if (reset) {
                setUsers(data.users);
                setOffset(LIMIT);
            } else {
                setUsers([...users, ...data.users]);
                setOffset(currentOffset + LIMIT);
            }

            setTotalCount(data.total_count);
        } catch (err) {
            setError('Failed to load leaderboard. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadLeaderboard(true);
    };

    const handleLoadMore = () => {
        if (!loadingMore && users.length < totalCount) {
            setLoadingMore(true);
            loadLeaderboard(false);
        }
    };

    const handleSimulate = async () => {
        if (simulating) return;

        try {
            setSimulating(true);
            await simulateGameplay();
            // Auto-refresh the leaderboard after simulation
            loadLeaderboard(true);
            Alert.alert('Updated!', '50 users have been updated with new scores.');
        } catch (err) {
            Alert.alert('Error', 'Failed to simulate gameplay');
        } finally {
            setSimulating(false);
        }
    };

    const renderItem = ({ item, index }) => {
        const isTopThree = item.rank <= 3;
        const rankColor =
            item.rank === 1 ? '#FFD700' :
                item.rank === 2 ? '#C0C0C0' :
                    item.rank === 3 ? '#CD7F32' :
                        '#666';

        return (
            <View style={[styles.userCard, isTopThree && styles.topThreeCard]}>
                <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
                    <Text style={styles.rankText}>#{item.rank}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.rating}>⭐ {item.rating} points</Text>
                </View>
            </View>
        );
    };

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#6366f1" />
                <Text style={styles.loadingText}>Loading more...</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>🏆 Leaderboard</Text>
                    <Text style={styles.subtitle}>Loading players...</Text>
                </View>
                <View style={styles.listContent}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((key) => (
                        <SkeletonCard key={key} />
                    ))}
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => {
                    setLoading(true);
                    loadLeaderboard();
                }}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🏆 Leaderboard</Text>
                <Text style={styles.subtitle}>
                    {totalCount.toLocaleString()} players competing
                </Text>
            </View>

            <FlatList
                data={users}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.username}-${index}`}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#6366f1']}
                    />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
            />

            <TouchableOpacity
                style={[styles.fab, simulating && styles.fabDisabled]}
                onPress={handleSimulate}
                disabled={simulating}
            >
                {simulating ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.fabText}>⚡ Simulate Updates</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 20,
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#1e293b',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
    },
    listContent: {
        padding: 16,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    topThreeCard: {
        borderColor: '#6366f1',
        borderWidth: 2,
        backgroundColor: '#1e1b4b',
    },
    rankBadge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    rankText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    rating: {
        fontSize: 14,
        color: '#94a3b8',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#94a3b8',
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#6366f1',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        flexDirection: 'row',
        alignItems: 'center',
    },
    fabDisabled: {
        opacity: 0.7,
    },
    fabText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
