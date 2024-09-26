import { useEffect, useState } from "react";
import { Image, StyleSheet, Touchable, TouchableOpacity, View, Text } from 'react-native';
import query from "../service/openAI";
import { ChatCompletionMessage } from "openai/resources";
import AsyncStorage from '@react-native-async-storage/async-storage';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { ThemedText } from "../components/ThemedText";
import { CHOICES } from "../constants/constants";
import ParallaxScrollView from "../components/ParallaxScrollView";
import { ButtonStyle } from "../constants/Colors";
import { useNavigation } from '@react-navigation/native';

const photoPage = () => {

    const [text, setText] = useState<string>('');

    const [pic, setPic] = useState<string>('');
    const [result, setResult] = useState<ChatCompletionMessage>();
    const navigation = useNavigation<any>();
    const [currentText, setCurrentText] = useState<string>('');
    const typeSpeed = 10;

    useEffect(() => {
        (async() => {
            try {
                let picItem = await AsyncStorage.getItem('pic');
                if(!picItem) return;
                setPic(picItem);

                const result = await TextRecognition.recognize(picItem);
                let text = result.text;
                setText(text);
                console.log(text);
            } catch(e){
                console.log(e);
            }
        })();

        return () => {
            init();
        }
    }, []);

    useEffect(() => {
        (async () => {
            if(text){
                console.log(text);
                let choice = await AsyncStorage.getItem('choice');
                let param:string[] = CHOICES;
                if(choice){
                    param = JSON.parse(choice);
                }
                const res = await query(text, param);
                setResult(res);
    
                console.log(res);
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
    }, [result])

    function init(){
        setText('');
        setPic('');
        setResult(undefined);
    }

    function retake() {
        init();
        navigation.navigate('index');
    }

    if(!result){
        return (
            <View style={styles.analyzing}>
                <ThemedText>Analyzing...</ThemedText>
            </View>
        )
    }

    if(pic){
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
                    <TouchableOpacity style={styles.button} onPress={retake}>
                        <Text style={styles.text}>Retake</Text>
                    </TouchableOpacity>
                </View>
            </ParallaxScrollView>  
        );
    }
};

export default photoPage;

const styles = StyleSheet.create({
    headerImage: {
      color: '#808080',
      bottom: -90,
      left: -35,
      position: 'absolute',
    },
    titleContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    analyzing: {
        margin: 'auto',
        justifyContent: 'center'
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
      },
    button: {
        backgroundColor: '#1976d2',
        flex: 1,
        alignItems: 'center',
        margin: 16,
        borderRadius: 4,
        padding: 8,
    }
  });

