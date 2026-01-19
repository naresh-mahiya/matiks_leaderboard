import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function SkeletonCard() {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            {/* Rank Circle */}
            <Animated.View style={[styles.circle, { opacity }]} />

            <View style={styles.content}>
                {/* Username Line */}
                <Animated.View style={[styles.line, styles.usernameLength, { opacity }]} />
                {/* Rating Line */}
                <Animated.View style={[styles.line, styles.ratingLength, { opacity }]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    circle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#334155',
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    line: {
        height: 16, // Height of text line
        backgroundColor: '#334155',
        borderRadius: 8,
        marginBottom: 6,
    },
    usernameLength: {
        width: '60%',
        height: 18,
        marginBottom: 8,
    },
    ratingLength: {
        width: '40%',
        height: 14,
    },
});
