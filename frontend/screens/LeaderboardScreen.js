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
    Platform,
    Modal,
} from 'react-native';
import { fetchLeaderboard, simulateGameplay } from '../services/api';
import SkeletonCard from '../components/SkeletonCard';

export default function LeaderboardScreen() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
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

            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={[styles.fab, simulating && styles.fabDisabled]}
                    onPress={handleSimulate}
                    disabled={simulating}
                >
                    {simulating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <View>
                            <Text style={styles.fabTitle}>⚡ Simulate Update</Text>
                            <Text style={styles.fabSubtitle}>Update score of 50 random users</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.infoButton}
                    onPress={() => setShowInfo(true)}
                >
                    <Text style={styles.infoText}>ℹ️</Text>
                </TouchableOpacity>
            </View>

            <Modal
                animationType="fade"
                transparent={true}
                visible={showInfo}
                onRequestClose={() => setShowInfo(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>⚡ Simulation Mode</Text>
                        <Text style={styles.modalText}>
                            This feature demonstrates the "Live Updates" requirement for testing purposes.
                        </Text>
                        <Text style={styles.modalText}>
                            Clicking the button will assign new random scores to <Text style={{ fontWeight: 'bold', color: '#fff' }}>50 users</Text>.
                        </Text>
                        <Text style={styles.modalText}>
                            5 of them will get <Text style={{ fontWeight: 'bold', color: '#FFD700' }}>SUPER HIGH scores (4800+)</Text> so you can see them jump to the top of the leaderboard immediately.
                        </Text>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowInfo(false)}
                        >
                            <Text style={styles.closeButtonText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    fabContainer: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        alignItems: 'flex-end',
    },
    fab: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    fabTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    fabSubtitle: {
        color: '#c7d2fe',
        fontSize: 10,
    },
    fabDisabled: {
        opacity: 0.7,
    },
    infoButton: {
        backgroundColor: '#334155',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#475569',
    },
    infoText: {
        fontSize: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#334155',
        elevation: 5,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 16,
        color: '#cbd5e1',
        marginBottom: 12,
        lineHeight: 24,
    },
    closeButton: {
        backgroundColor: '#6366f1',
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    fabText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
