import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  Image,
  FlatList,
  ScrollView
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Mock data for posts
const posts = [
  {
    id: '1',
    username: 'Bakhtawar Ahmad',
    location: 'India',
    time: '5 h',
    title: 'Help identifying problem with my Apple',
    content: 'Planta has detected a possible problem with my Apple. I was given a few possibilities: Powdery Mildew or Healthy. Can you help me identifying the issue?',
    // image: require('./assets/apple-plant.jpg'), // You'll need to add your own image
    likes: 0,
    dislikes: 0,
    answers: 1
  },
  // Add more mock posts here
];

// Filter options
const filters = [
  { id: '1', name: 'Apple', icon: '🍎' },
  { id: '2', name: 'Banana', icon: '🍌' },
  { id: '3', name: 'Apricot', icon: '🌰' },
  { id: '4', name: 'Popular', icon: '' },
];

export default function CommunityScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with search */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search in Community" 
            placeholderTextColor="#666"
          />
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="more-horizontal" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Filter section */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Filter by</Text>
          <TouchableOpacity>
            <Text style={styles.changeButton}>Change</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
          {filters.map(filter => (
            <TouchableOpacity key={filter.id} style={styles.filterChip}>
              <Text>{filter.icon} {filter.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Posts list */}
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            {/* Post image */}
            {/* <Image
              source={item.image}
              style={styles.postImage}
              // defaultSource={require('./assets/placeholder.jpg')} // Add a placeholder image
            /> */}
            
            {/* User info */}
            <View style={styles.postContent}>
              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={20} color="#FFF" />
                </View>
                <View>
                  <View style={styles.nameLocationContainer}>
                    <Text style={styles.username}>{item.username}</Text>  
                    <Text style={styles.location}>• {item.location}</Text>
                  </View>
                  <Text style={styles.timeAgo}>{item.time}</Text>
                </View>
              </View>
              
              {/* Post title and content */}
              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.postText}>{item.content}</Text>
              
              <View style={styles.postFooter}>
                <View style={styles.actionsContainer}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="thumbs-up-outline" size={20} color="black" />
                    <Text style={styles.actionText}>{item.likes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="thumbs-down-outline" size={20} color="black" />
                    <Text style={styles.actionText}>{item.dislikes}</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity style={styles.askButton}>
                  <Feather name="edit-2" size={16} color="white" />
                  <Text style={styles.askButtonText}>Ask Community</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.translateText}>Translate</Text>
              <Text style={styles.answersCount}>{item.answers} answers</Text>
            </View>
          </View>
        )}
      />
      
     
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#000',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  filterSection: {
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeButton: {
    color: '#2962FF',
    fontWeight: '500',
  },
  filterScrollView: {
    paddingLeft: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
  },
  postCard: {
    backgroundColor: '#fff',
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  postContent: {
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4886E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  nameLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontWeight: 'bold',
    color: '#4886E8',
    fontSize: 16,
  },
  location: {
    marginLeft: 4,
    color: '#666',
  },
  timeAgo: {
    color: '#666',
    fontSize: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  postText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    marginBottom: 16,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    marginLeft: 4,
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3366FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  askButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  translateText: {
    color: '#666',
    marginTop: 12,
  },
  answersCount: {
    textAlign: 'right',
    color: '#666',
    marginTop: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: '#e8f5e9',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
  activeNavText: {
    color: '#2E7D32',
  },
});