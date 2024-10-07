import { useEffect, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View, Text, Alert } from 'react-native';
import query from "../../service/openAI";
import AsyncStorage from '@react-native-async-storage/async-storage';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { ThemedText } from "../../components/ThemedText";
import { CHOICES } from "../../constants/constants";
import ParallaxScrollView from "../../components/ParallaxScrollView";
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Table, Row, Rows } from 'react-native-table-component';

const PhotoPage = () => {
    const [processing, setProcessing] = useState<boolean>(false);
    const [text, setText] = useState<string>('');
    const [pic, setPic] = useState<string>('');
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const [category, setCategory] = useState<string[]>([]);
    const [ingredient, setIngredient] = useState('');
    const [nutrition, setNutrition] = useState('');
    const [brand, setBrand] = useState('');
    const [logo, setLogo] = useState('');

    useEffect(() => {
        if(isFocused){
            (async() => {
                try {
                    let picItem = await AsyncStorage.getItem('pic');
                    if(!picItem) return;
                    setProcessing(true);
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
                    setCategory(param);
                }
                const res = await query(text, param);

                if(!res.content){
                    setProcessing(false);
                    throw new Error('Fail to analyze');
                }

                const logoText = res.content.split(/\*\*Logo:\*\*|Logo:/);
                setLogo(logoText[1]);
                const brandText = logoText[0].split(/\*\*Brand:\*\*|Brand:/)
                setBrand(brandText[1]);
                const nutritionText = brandText[0].split(/\*\*Nutrition:\*\*|Nutrition:/);
                setNutrition(nutritionText[1]);
                const ingredientText = nutritionText[0].split(/\*\*Ingredient:\*\*|Ingredient:/);
                setIngredient(ingredientText[1]);
                setProcessing(false);
            }
        })();
        
    }, [text]);

    const splitResponse = (response: string) => {
        const tablePattern = /\|(.+)\|/g;
        const tableMatches = response.match(tablePattern);
    
        if (tableMatches) {
          const SplitText = response.replace(tablePattern, '').trim();
          const table = tableMatches.join('\n');
          return { SplitText, table };
        }
    
        return { SplitText: response, table: null };
      };

    const renderTable = (table: string) => {
        const tableRows = table.split('\n')
        .filter(row => !/^[-\s|]+$/.test(row)) // Filters out rows that contain only dashes or pipes
        .map(row => {
            return row.substring(1, row.length-2).split('|').map(cell => cell.trim());
        });
        const header = tableRows[0];
        const data = tableRows.slice(1);
    
        return (
            <View style={{ padding: 10 }}>
              <Table borderStyle={styles.tableBorder}>
                <Row data={header} style={styles.header} textStyle={styles.headerText} />
                <Rows data={data} style={styles.dataRow} textStyle={styles.dataText} />
              </Table>
            </View>
        );
      };

    const renderResult = (title: string, result: string, table?: string | null) => {
        return (
            <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: 600 }}>{title}: </Text>
                {table ? renderTable(table) : <Text>{result}</Text>}
            </View>
        )
    };

    const renderIngredient = () => {
        const { table } = splitResponse(ingredient);
        return renderResult(CHOICES[0], ingredient, table);
    };

    const renderNutrition = () => {
        const { table } = splitResponse(nutrition);
        return renderResult(CHOICES[1], nutrition, table)
    };

    const renderBrand = () => {
        return renderResult(CHOICES[2], brand);
    };

    const renderLogo = () => {
        return renderResult(CHOICES[3], logo);
    };

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
                {category.includes(CHOICES[0]) && renderIngredient()}
                {category.includes(CHOICES[1]) && renderNutrition()}
                {category.includes(CHOICES[2]) && renderBrand()}
                {category.includes(CHOICES[3]) && renderLogo()}
                <TouchableOpacity style={styles.button} onPress={goToIndex}>
                    <Text style={styles.text}>Retake</Text>
                </TouchableOpacity>
            </View>
        </ParallaxScrollView>  
    );
};

export default PhotoPage;

const styles = StyleSheet.create({
    tableBorder: {
        borderWidth: 1, 
        borderColor: '#c8e1ff',
    },
    header: {
        height: 50, 
        backgroundColor: '#f1f8ff', // Light blue background for header
      },
    headerText: {
        textAlign: 'center', 
        fontWeight: 'bold', // Bold text for header
        fontSize: 16, 
        color: '#333', // Darker text for header
    },
    dataRow: {
        height: 40, 
        backgroundColor: '#fff', // White background for data rows
    },
    dataText: {
        textAlign: 'center', 
        fontSize: 14, 
        color: '#555', // Dark gray for text
    },
    alternatingRow: {
       backgroundColor: '#f9f9f9', // Alternate row background color
    },
    tableText: { 
        margin: 6 
    },
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

