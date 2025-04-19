// app/chatbot.tsx
import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { Julep } from '@julep/sdk';
import Header from '@/components/Header';

const JULEP_AGENT_ID = "06802005-adc9-75f1-8000-5ea756eb8532"; // <-- REPLACE with your actual Agent ID

// 🚨 Use this only in dev. Avoid hardcoding in production.
const JULEP_API_KEY: string = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTAxNTkwMTcsImlhdCI6MTc0NDk3NTAxNywic3ViIjoiNjVhMWE5MzYtYjBlMy01OTI0LTk3NzQtNjU1NDVmYmYwNTgyIn0.QbU03Bwv5Qv4Wv5sKuXu26wE9vac0lguHwKlUfzVeLvwVY1-UlMT7kr3h8K6XQEQJUn925NB5OD4uLR0jPHRAQ"; // <-- YOUR ACTUAL KEY HERE

const PLACEHOLDER_API_KEY_STRING = "YOUR_JULEP_API_KEY_HERE";


const julepTaskDefinition = {
  name: 'Planta Chat Response',
  description: 'Get a response from the Planta chatbot agent based on user input',
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
        <Header/>
        <Stack.Screen options={{ title: 'Planta Chatbot' }} />
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
        />

        {isTyping && (
          <View style={styles.typingIndicatorContainer}>
            <ActivityIndicator size="small" color="#065F46" />
            <Text style={styles.typingText}>Bot is typing...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            blurOnSubmit={false}
            editable={!isTyping && julepClient !== null}
          />
          <Button title="Send" onPress={handleSendMessage} disabled={!inputText.trim() || isTyping || julepClient === null} />
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
  messagesList: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    paddingBottom: 80,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  messageText: {
    fontSize: 16,
    color: '#1F2937',
  },
  systemText: {
    fontSize: 12,
    color: '#991B1B',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginLeft: 10,
    marginBottom: 10,
  },
  typingText: {
    marginLeft: 5,
    color: '#1F2937',
    fontStyle: 'italic',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
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
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#F9FAFB',
  },
});
