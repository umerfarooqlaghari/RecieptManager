import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { Ionicons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// Top section height so blobs don't run all the way down
const TOP_SECTION_HEIGHT = height * 0.4;

export default function HomeScreen() {
  const { session } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const firstName = session?.user?.user_metadata?.first_name || 'User';

  return (
    <View style={styles.container}>
      {/* Background Blobs (Only Top Half) replicating AuthScreen aesthetic */}
      <View style={styles.topBackground}>
        <View style={styles.blobPurple} />
        <View style={styles.blobTeal} />
        <View style={styles.blobLight} />
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
      </View>

      <Animated.ScrollView 
        style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navbar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuBtn} onPress={handleSignOut}>
            <Ionicons name="menu" size={24} color="#e2e8f0" />
          </TouchableOpacity>
          <View style={styles.avatarContainer}>
             <Ionicons name="person-circle-outline" size={45} color="#e2e8f0" />
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.nameText}>{firstName}!</Text>
          </View>
          <TouchableOpacity style={styles.searchBtn}>
            <Ionicons name="search" size={20} color="#e2e8f0" />
          </TouchableOpacity>
        </View>

        {/* Main Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>$ 2,800.00</Text>
        </View>

        {/* Recent Totals */}
        <View style={styles.recentTotalsCard}>
          <View style={styles.recentRow}>
            <Text style={styles.recentLabel}>Recent Income</Text>
            <Text style={styles.recentValue}>$ 3,500.00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.recentRow}>
            <Text style={styles.recentLabel}>Recent Expenses</Text>
            <Text style={styles.recentValue}>$ 1,025.00</Text>
          </View>
        </View>

        {/* Action Buttons (3 Squares) */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionSquare}>
            <View style={styles.actionIconContainer}>
              <Feather name="minus" size={14} color="#e2e8f0" />
            </View>
            <Text style={styles.actionSmallText}>Add</Text>
            <Text style={styles.actionBigText}>Expense</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionSquare}>
            <View style={styles.actionIconContainer}>
              <Feather name="plus" size={14} color="#d8b4e2" />
            </View>
            <Text style={styles.actionSmallText}>Add</Text>
            <Text style={[styles.actionBigText, { color: '#d8b4e2' }]}>Income</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionSquare}>
            <View style={styles.actionIconContainer}>
              <Feather name="check" size={14} color="#e2e8f0" />
            </View>
            <Text style={styles.actionSmallText}>View</Text>
            <Text style={styles.actionBigText}>Transactions</Text>
          </TouchableOpacity>
        </View>

        {/* Financial Report Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Financial Report</Text>
          
          <View style={styles.barsContainer}>
            {/* Bar 1 */}
            <View style={styles.barWrapper}>
              <Text style={styles.barPercent}>40%</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: '40%', backgroundColor: '#f9c5d1' }]} />
              </View>
            </View>
            {/* Bar 2 */}
            <View style={styles.barWrapper}>
              <Text style={styles.barPercent}>30%</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: '30%', backgroundColor: '#cbe2c8' }]} />
              </View>
            </View>
            {/* Bar 3 */}
            <View style={styles.barWrapper}>
              <Text style={styles.barPercent}>15%</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: '15%', backgroundColor: '#f1e6a0' }]} />
              </View>
            </View>
            {/* Bar 4 */}
            <View style={styles.barWrapper}>
              <Text style={styles.barPercent}>10%</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: '10%', backgroundColor: '#d0d1e6' }]} />
              </View>
            </View>
            {/* Bar 5 */}
            <View style={styles.barWrapper}>
              <Text style={styles.barPercent}>5%</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: '5%', backgroundColor: '#e2e8f0' }]} />
              </View>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#f9c5d1'}]}/><Text style={styles.legendText}>Food</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#f1e6a0'}]}/><Text style={styles.legendText}>Transport</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#e2e8f0'}]}/><Text style={styles.legendText}>Others</Text></View>
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#cbe2c8'}]}/><Text style={styles.legendText}>Housing</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#d0d1e6'}]}/><Text style={styles.legendText}>Entertainment</Text></View>
            </View>
          </View>
        </View>

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214', // Very dark near-black to contrast the top
  },
  topBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TOP_SECTION_HEIGHT,
    overflow: 'hidden',
  },
  blobPurple: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: '#520c61', 
    top: -height * 0.1,
    left: -width * 0.2,
    opacity: 0.8,
  },
  blobTeal: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#1f1923ff', 
    bottom: -height * 0.05,
    right: -width * 0.3,
    opacity: 0.9,
  },
  blobLight: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: '#5e0e59a9', 
    top: height * 0.1,
    left: width * 0.2,
    opacity: 0.9,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 22,
    color: '#e2e8f0',
    fontWeight: '400',
  },
  nameText: {
    fontSize: 34,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: -2,
  },
  searchBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1c1c1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: '#1f1f22',
    borderRadius: 30,
    padding: 25,
    paddingTop: 30,
    paddingBottom: 30,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  balanceLabel: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '500',
  },
  balanceValue: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '600',
    marginTop: 15,
    textAlign: 'right',
  },
  recentTotalsCard: {
    backgroundColor: '#1f1f22',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentLabel: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '400',
  },
  recentValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 15,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionSquare: {
    backgroundColor: '#1c1c1e',
    flex: 1,
    aspectRatio: 1,
    borderRadius: 25,
    padding: 15,
    marginHorizontal: 5,
    justifyContent: 'flex-end',
  },
  actionIconContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSmallText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 20,
  },
  actionBigText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: '#1f1f22',
    borderRadius: 30,
    padding: 25,
    marginBottom: 30,
  },
  chartTitle: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 25,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 120,
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  barWrapper: {
    alignItems: 'center',
    width: '16%',
  },
  barPercent: {
    color: '#71717a',
    fontSize: 11,
    marginBottom: 8,
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 10,
  },
  legendContainer: {
    gap: 15,
    marginTop: 5,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '33%', // Enforce grid alignment across rows
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '500',
  },
});
