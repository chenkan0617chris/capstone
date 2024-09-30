import { useEffect, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View, Text, Alert } from 'react-native';
import query from "../../service/openAI";
import { ChatCompletionMessage } from "openai/resources";
import AsyncStorage from '@react-native-async-storage/async-storage';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { ThemedText } from "../../components/ThemedText";
import { CHOICES } from "../../constants/constants";
import ParallaxScrollView from "../../components/ParallaxScrollView";
import { useIsFocused, useNavigation } from '@react-navigation/native';

const PhotoPage = () => {
    const [processing, setProcessing] = useState<boolean>(false);
    const [text, setText] = useState<string>('');
    const [pic, setPic] = useState<string>('');
    const [result, setResult] = useState<ChatCompletionMessage>();
    const [currentText, setCurrentText] = useState<string>('');
    const typeSpeed = 10;
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();

    useEffect(() => {
        if(isFocused){
            (async() => {
                try {
                    let picItem = await AsyncStorage.getItem('pic');
                    if(!picItem) return;
                    setProcessing(true);
                    setCurrentText('');
                    setResult(undefined);
                    setPic(picItem);
                    const result = await TextRecognition.recognize(picItem);
                    let text = result.text;
                    if(!text){
                        return emptyChoiceAlert();
                    }
                    setText(text);
                    await AsyncStorage.setItem('pic', '');
                } catch(e){
                    console.log(e);
                }
            })();
        }
    }, [isFocused]);

    useEffect(() => {
        (async () => {
            if(text){
                let choice = await AsyncStorage.getItem('choice');
                let param:string[] = CHOICES;
                if(choice){
                    param = JSON.parse(choice);
                }
                const res = await query(text, param);
                setResult(res);
                setProcessing(false);
            }
        })();
        
    }, [text]);

    useEffect(() => {
        const content = result?.content;
        if (!content) return;
        let currentIndex = 0;
        const typeInterval = setInterval(() => {
            if(currentIndex < content.length){
                setCurrentText(prevText => prevText + content[currentIndex]);
                currentIndex++;
            } else {
                clearInterval(typeInterval);
            }

        }, typeSpeed);

        return () => clearInterval(typeInterval);
    }, [result]);

    async function goToIndex() {
        await navigation.navigate('index');
    }

    const emptyChoiceAlert = () => {
        return Alert.alert('Notification', 'There is nothing after detected, please retake a picture!', [
          {
            text: 'Ok',
            onPress: goToIndex,
          }
        ])
      };

    if(!pic){
        return <View style={styles.analyzing}>
            <ThemedText>You haven't taken a picture yet! Please go to take a picture.</ThemedText>
            <TouchableOpacity style={styles.button} onPress={goToIndex}>
                <Text style={styles.text}>Take a Picture</Text>
            </TouchableOpacity>
        </View>
    }

    if(processing){
        return (
            <View style={styles.analyzing}>
                <ThemedText>Analyzing...</ThemedText>
            </View>
        )
    }

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
            headerImage={
            <Image 
                style={{ width: '100%', height: '100%' }} 
                source={{ uri: pic}}
            />}>
            <View style={{ flex: 1}}>
                <ThemedText>
                    {currentText}
                </ThemedText>
                <TouchableOpacity style={styles.button} onPress={goToIndex}>
                    <Text style={styles.text}>Retake</Text>
                </TouchableOpacity>
            </View>
        </ParallaxScrollView>  
    );
};

export default PhotoPage;

const styles = StyleSheet.create({
    headerImage: {
      color: '#808080',
      bottom: -90,
      left: -35,
      position: 'absolute',
    },
    analyzing: {
        margin: 'auto',
        justifyContent: 'center'
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        lineHeight: 24
      },
    button: {
        backgroundColor: '#1976d2',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 16,
        borderRadius: 4,
        padding: 8,
        height: 48
    }
  });

