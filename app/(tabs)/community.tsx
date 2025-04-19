import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';

// Mock data for posts from Prayagraj region
const posts = [
  {
    id: '1',
    username: 'Rajesh Kumar',
    location: 'Naini, Prayagraj',
    time: '2 h',
    title: 'Wheat crop yellowing issue',
    content: 'My wheat crop in Naini area is showing yellow patches. Anyone facing similar issues or has suggestions?',
    likes: 5,
    comments: 3
  },
  {
    id: '2', 
    username: 'Priya Singh',
    location: 'Civil Lines, Prayagraj',
    time: '5 h',
    title: 'Best time to sow Rabi crops?',
    content: 'When is the ideal time to start sowing Rabi crops in Prayagraj region considering the current weather conditions?',
    likes: 8,
    comments: 6
  }
];

export default function CommunityScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search discussions..."
          placeholderTextColor="#666"
        />
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.location}>{item.location} • {item.time}</Text>
              </View>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.content}>{item.content}</Text>

            <View style={styles.postFooter}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart-outline" size={20} color="#666" />
                <Text style={styles.actionText}>{item.likes}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={20} color="#666" />
                <Text style={styles.actionText}>{item.comments}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16
  },
  postCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  userInfo: {
    flex: 1
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  content: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22
  },
  postFooter: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24
  },
  actionText: {
    marginLeft: 4,
    color: '#666'
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4
  }
});