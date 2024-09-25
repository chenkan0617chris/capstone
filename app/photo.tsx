import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from 'react-native';
import query from "../service/openAI";
import { ChatCompletionMessage } from "openai/resources";
import AsyncStorage from '@react-native-async-storage/async-storage';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { ThemedText } from "../components/ThemedText";
import { CHOICES } from "../constants/constants";
import ParallaxScrollView from "../components/ParallaxScrollView";

const photoPage = () => {

    const [text, setText] = useState<string>('');

    const [pic, setPic] = useState<string>('');
    const [result, setResult] = useState<ChatCompletionMessage>();
    

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
            setText('');
            setPic('');
            setResult(undefined);
        }
    }, []);

    useEffect(() => {
        (async () => {
            if(text){
                console.log(text);
                let choice = await AsyncStorage.getItem('choice') || CHOICES[0];
                const res = await query(text, choice);
                setResult(res);
    
                console.log(res);
            }
        })();
        
    }, [text]);

    if(!result){
        return (
            <View style={styles.analyzing}>
                <ThemedText>Analyzing...</ThemedText>
            </View>
        )
    }

    if(pic){
        return (
            // <View>
            //     <Image 
            //         style={{ width: '100%', height: '50%' }}
            //         source={{ uri: pic }}
            //     />
            //     <ThemedText>
            //         {result.content}
            //     </ThemedText>
            // </View>
            <ParallaxScrollView
                headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
                headerImage={
                <Image 
                    style={{ width: '100%', height: '100%' }} 
                    source={{ uri: pic}}
                />}>
                <ThemedText>
                    {result.content}
                </ThemedText>
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
  });

