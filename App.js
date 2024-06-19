import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as Notifications from 'expo-notifications';

// Enable notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const fetchPosts = async (page = 1, limit = 10) => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=${limit}`
  );
  return response.json();
};

const heavyComputation = (data) => {
  console.log('Heavy computation starts');
  // Simulate heavy computation with a delay
  const start = Date.now();
  while (Date.now() - start < 200) {
    // Simulate heavy computation
  }
  console.log('Heavy computation ends');
  return `Computed: ${data.title}`;
};

const PostItem = React.memo(({ post, onPress }) => {
  const computedData = useMemo(() => heavyComputation(post), [post]);

  return (
    <TouchableOpacity onPress={() => onPress(post.id)} style={styles.card}>
      <Text style={styles.textStyle}>
        {post.id}: {computedData}
      </Text>
    </TouchableOpacity>
  );
});

const PostDetails = React.memo(
  ({ postId, onClose }) => {
    const [postDetails, setPostDetails] = useState(null);

    useEffect(() => {
      const fetchPostDetails = async () => {
        const response = await fetch(
          `https://jsonplaceholder.typicode.com/posts/${postId}`
        );
        const data = await response.json();
        setPostDetails(data);
      };

      fetchPostDetails();
    }, [postId]);

    if (!postDetails) {
      return <Text>Loading...</Text>;
    }

    return (
      <View style={styles.card}>
        <Text style={styles.textStyle}>{postDetails.title}</Text>
        <Text style={{ marginBottom: 10 }}>{postDetails.body}</Text>
        <Button title='Close' onPress={onClose} />
      </View>
    );
  },
  (pev, pre) => pev.onClose !== pre.onClose
);

export default function App() {
  const [posts, setPosts] = useState([]);
  const [counter, setCounter] = useState(0);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    Notifications.scheduleNotificationAsync({
      content: { title: 'FETCHING DATA' },
      trigger: null,
    });
    const data = await fetchPosts(page);
    if (page > 1) {
      let datas = [...posts, ...data];
      setPosts(datas);
    } else {
      setPosts(data);
    }
    Notifications.scheduleNotificationAsync({
      content: { title: 'FETCHING DATA COMPLETE' },
      trigger: null,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const goNext = async () => {
    setPage(page + 1);
    await fetchData();
  };

  const onRefresh = async () => {
    setPage(1);
    fetchData();
  };

  const handlePostPress = useCallback((postId) => {
    setSelectedPostId(postId);
  }, []);

  const handleCounterIncrement = () => setCounter(counter + 1);
  const handleCounterDecrement = () => setCounter(counter - 1);

  return (
    <View style={{ padding: 20, marginBottom: 20 }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
      >
        <Button title='-' onPress={handleCounterDecrement} />
        <Text style={{ marginHorizontal: 20, fontSize: 20 }}>{counter}</Text>
        <Button title='+' onPress={handleCounterIncrement} />
      </View>

      {selectedPostId ? (
        <PostDetails
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      ) : (
        <View style={{ height: Dimensions.get('window').height / 1.1 }}>
          <FlatList
            refreshing={loading}
            onRefresh={() => onRefresh()}
            data={posts}
            keyExtractor={(item, index) => index}
            renderItem={({ item }) => (
              <PostItem post={item} onPress={handlePostPress} />
            )}
            onEndReached={goNext}
            onEndReachedThreshold={0.1}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderColor: '#666',
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
  },
  textStyle: {
    fontSize: 20,
  },
});
