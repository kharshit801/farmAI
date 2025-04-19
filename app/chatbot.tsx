import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Stack } from 'expo-router';
import { Julep } from '@julep/sdk';
import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';

const JULEP_AGENT_ID = "06802005-adc9-75f1-8000-5ea756eb8532"; // <-- REPLACE with your actual Agent ID
// 🚨 Use this only in dev. Avoid hardcoding in production.
const JULEP_API_KEY: string = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTAxNTkwMTcsImlhdCI6MTc0NDk3NTAxNywic3ViIjoiNjVhMWE5MzYtYjBlMy01OTI0LTk3NzQtNjU1NDVmYmYwNTgyIn0.QbU03Bwv5Qv4Wv5sKuXu26wE9vac0lguHwKlUfzVeLvwVY1-UlMT7kr3h8K6XQEQJUn925NB5OD4uLR0jPHRAQ"; // <-- YOUR ACTUAL KEY HERE
const PLACEHOLDER_API_KEY_STRING = "YOUR_JULEP_API_KEY_HERE";

const julepTaskDefinition = {
  name: 'FarmAI Chat Response',
  description: 'Get a response from the FarmAI chatbot agent based on user input',
  main: [
    {
      type: 'prompt',
      prompt: "$ f'You are a friendly and helpful AI assistant specifically designed to answer questions about plants, gardening, and plant care. Keep responses concise and encouraging.\\n\\nUser: {steps[0].input.message}'",
    },
  ],
};

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'system';
}

const initialMessages: Message[] = [
  { id: '1', text: 'Hello! How can I help you with your plants today?', sender: 'bot' },
];

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  const julepClient = useMemo(() => {
    if (JULEP_API_KEY === PLACEHOLDER_API_KEY_STRING) {
      setMessages(prev => [...prev, { id: 'error-key-placeholder', text: 'Error: Julep API key placeholder not replaced.', sender: 'system' }]);
      return null;
    }
    if (!JULEP_API_KEY) {
      setMessages(prev => [...prev, { id: 'error-key-empty', text: 'Error: Julep API key is empty.', sender: 'system' }]);
      return null;
    }
    return new Julep({ apiKey: JULEP_API_KEY });
  }, []);

  const getBotResponse = async (userMessage: string) => {
    if (!julepClient) {
      return;
    }
    setIsTyping(true);
    try {
      const task = await julepClient.tasks.create(JULEP_AGENT_ID, julepTaskDefinition);
      const execution = await julepClient.executions.create(task.id, {
        input: { message: userMessage }
      });
      let result: any;
      while (true) {
        result = await julepClient.executions.get(execution.id);
        if (result.status === 'succeeded') {
          const botText = result.output?.choices?.[0]?.message?.content;
          if (botText) {
            const newBotMessage: Message = {
              id: Math.random().toString(),
              text: botText,
              sender: 'bot',
            };
            setMessages(prev => [...prev, newBotMessage]);
          } else {
            setMessages(prev => [...prev, { id: `warn-${Date.now()}`, text: "Bot response was empty.", sender: 'system' }]);
          }
          break;
        } else if (result.status === 'failed') {
          setMessages(prev => [...prev, { id: `error-${Date.now()}`, text: `Bot error: ${result.error?.message || 'Unknown error'}`, sender: 'system' }]);
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { id: `error-${Date.now()}`, text: `Bot error: ${err.message || String(err) || 'Unknown API error'}`, sender: 'system' }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim() && !isTyping && julepClient) {
      const newUserMessage: Message = {
        id: Math.random().toString(),
        text: inputText.trim(),
        sender: 'user',
      };
      setMessages(prev => [...prev, newUserMessage]);
      setInputText('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      getBotResponse(newUserMessage.text);
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageBubble,
      item.sender === 'user' ? styles.userMessage : item.sender === 'bot' ? styles.botMessage : styles.systemMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.sender === 'system' ? styles.systemText : null
      ]}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SafeAreaView style={styles.container}>
        <Header />
        <Stack.Screen options={{ 
          title: 'FarmAI Chatbot',
          headerShown: false
        }} />
        
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onLayout={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
          />

          {isTyping && (
            <View style={styles.typingIndicatorContainer}>
              <ActivityIndicator size="small" color="#065F46" />
              <Text style={styles.typingText}>Bot is typing...</Text>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about your plants..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            blurOnSubmit={false}
            editable={!isTyping && julepClient !== null}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isTyping || julepClient === null) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isTyping || julepClient === null}
          >
            <Ionicons name="send" size={wp('5%')} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatContainer: {
    flex: 1,
    paddingBottom: hp('8%'),
  },
  messagesList: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    paddingBottom: hp('2%'),
  },
  messageBubble: {
    padding: wp('3%'),
    borderRadius: wp('4%'),
    marginBottom: hp('1%'),
    maxWidth: wp('75%'),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: wp('1%'),
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: wp('1%'),
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: hp('0.6%'),
    paddingHorizontal: wp('3%'),
    borderRadius: wp('3%'),
    marginVertical: hp('1%'),
  },
  messageText: {
    fontSize: wp('4%'),
    color: '#1F2937',
  },
  systemText: {
    fontSize: wp('3.5%'),
    color: '#991B1B',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: wp('2%'),
    backgroundColor: '#fff',
    borderRadius: wp('4%'),
    marginLeft: wp('4%'),
    marginBottom: hp('1%'),
    borderBottomLeftRadius: wp('1%'),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  typingText: {
    marginLeft: wp('1.5%'),
    color: '#1F2937',
    fontStyle: 'italic',
    fontSize: wp('3.5%'),
  },
  inputContainer: {
    flexDirection: 'row',
    padding: wp('3%'),
    paddingVertical: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: wp('5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    marginRight: wp('2%'),
    backgroundColor: '#F9FAFB',
    fontSize: wp('4%'),
  },
  sendButton: {
    backgroundColor: '#1f1f1f',
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});