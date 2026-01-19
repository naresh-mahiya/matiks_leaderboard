import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { searchUsers } from '../services/api';
import SkeletonCard from '../components/SkeletonCard';

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);

    // Debounce search
    useEffect(() => {
        if (query.trim() === '') {
            setUsers([]);
            setSearched(false);
            return;
        }

        const timer = setTimeout(() => {
            performSearch(query);
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const performSearch = async (searchQuery) => {
        try {
            setLoading(true);
            setError(null);
            const data = await searchUsers(searchQuery);
            setUsers(data.users);
            setSearched(true);
        } catch (err) {
            setError('Failed to search users. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        const isTopThree = item.rank <= 3;
        const rankColor =
            item.rank === 1 ? '#FFD700' :
                item.rank === 2 ? '#C0C0C0' :
                    item.rank === 3 ? '#CD7F32' :
                        '#6366f1';

        return (
            <View style={[styles.userCard, isTopThree && styles.topThreeCard]}>
                <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
                    <Text style={styles.rankText}>#{item.rank}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.rating}>⭐ {item.rating} points</Text>
                </View>
                <View style={styles.globalRankBadge}>
                    <Text style={styles.globalRankLabel}>Global Rank</Text>
                    <Text style={styles.globalRankValue}>#{item.rank}</Text>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => {
        if (loading) return null;

        if (!searched) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyTitle}>Search for Players</Text>
                    <Text style={styles.emptyText}>
                        Enter a username to find players and see their global rank
                    </Text>
                </View>
            );
        }

        if (users.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>😕</Text>
                    <Text style={styles.emptyTitle}>No Results Found</Text>
                    <Text style={styles.emptyText}>
                        Try searching with a different username
                    </Text>
                </View>
            );
        }

        return null;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🔍 Search Players</Text>
                <Text style={styles.subtitle}>Find players and view their global rank</Text>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Enter username..."
                    placeholderTextColor="#64748b"
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {query.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setQuery('')}
                    >
                        <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.listContent}>
                    {[1, 2, 3].map((key) => (
                        <SkeletonCard key={key} />
                    ))}
                </View>
            ) : (
                <>
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <FlatList
                        data={users}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => `${item.username}-${index}`}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={renderEmptyState}
                    />

                    {users.length > 0 && (
                        <View style={styles.resultsFooter}>
                            <Text style={styles.resultsCount}>
                                Found {users.length} player{users.length !== 1 ? 's' : ''}
                            </Text>
                        </View>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        backgroundColor: '#1e293b',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#334155',
        paddingHorizontal: 16,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#fff',
    },
    clearButton: {
        padding: 8,
    },
    clearButtonText: {
        fontSize: 20,
        color: '#64748b',
    },
    listContent: {
        padding: 16,
        flexGrow: 1,
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
    globalRankBadge: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    globalRankLabel: {
        fontSize: 10,
        color: '#c7d2fe',
        marginBottom: 2,
    },
    globalRankValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#94a3b8',
    },
    errorContainer: {
        padding: 16,
        margin: 16,
        backgroundColor: '#7f1d1d',
        borderRadius: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#fca5a5',
        textAlign: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    resultsFooter: {
        padding: 16,
        backgroundColor: '#1e293b',
        borderTopWidth: 1,
        borderTopColor: '#334155',
        alignItems: 'center',
    },
    resultsCount: {
        fontSize: 14,
        color: '#94a3b8',
    },
});
