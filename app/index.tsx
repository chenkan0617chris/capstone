import { StyleSheet, Image, View, TouchableOpacity, Text, Button, Dimensions, Alert } from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { TabBarIcon } from '../components/navigation/TabBarIcon';
import { CHOICES } from '../constants/constants';
import { ButtonStyle } from '../constants/Colors';
import { processPic } from '../service/opencv';
import cv, { bool } from "@techstark/opencv-js";
import Checkbox from 'expo-checkbox';

export default function HomeScreen() {

  const [facing, setFacing] = useState<CameraType>('back');

  const [setting, setSetting] = useState<boolean>(false);
  const [pic, setPic] = useState<any>();
  const [choices, setChoices] = useState<string[]>(CHOICES);
  const [chooseFlag, setChooseFlag] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>();
  const picRef = useRef<any>();
  
  const navigation = useNavigation<any>();

  const windowWidth = Dimensions.get('window').width;

  useEffect(() => {
    (async() => {
      const choiceStore = await AsyncStorage.getItem('choice');
      if(choiceStore){
        setChoices(JSON.parse(choiceStore));
      }
    })();
    
    
    return () => {
      init();
    }
  }, []);

  const init = () => {
    setSetting(false);
    setPic(undefined);
    setFacing('back');
  };

  
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  function toggleCameraOpen(){
    setSetting(current => !current);
  }

  const takePic = async () => {
    let options = {
      quality: 1,
      base64: true,
      exif: false
    };

    let newPic = await cameraRef.current.takePictureAsync(options);
    setPic(newPic.uri);

    try {
      await AsyncStorage.setItem('pic', newPic.uri);
    } catch (e) {
      console.log(e);
    }
  };

  const renderOptions = () => {
    console.log(choices);
    if(chooseFlag){
      return (
          <View style={styles.cameraBox}>
            <ThemedText>
              Your Choices: {choices}
            </ThemedText>
            <TouchableOpacity onPress={() => setChooseFlag(false)} style={{ marginBottom: 10 }}>
              <Text style={{ color: 'blue', textDecorationLine: 'underline' }}>Go back to setting</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSetting(true)}>
              <View style={styles.cameraBorder}>
                <TabBarIcon style={{fontSize: 50}} name='camera-sharp' />
              </View>
            </TouchableOpacity>
          </View>
      );
    }
    return <View style={{ display: 'flex', alignItems: 'center' }}>
        <ThemedText style={{ textAlign: 'center', marginBottom: 20 }}>Choose what you want to analyze:</ThemedText>
        {CHOICES.map((item: string) => {
          return <View key={item} style={{ display: 'flex', alignSelf: 'flex-start', flexDirection: 'row' ,alignItems: 'center', justifyContent: 'flex-start' }}>
            <Checkbox
              style={{ margin: 8 }}
              value={choices.includes(item)}
              onValueChange={(value: boolean) => {
                if(value){
                  setChoices([...choices, item]);
                } else {
                  setChoices(choices.filter((c: string) => c !== item));
                }
              }}
              color={choices.includes(item) ? '#4630EB' : undefined}
            />
            <Text>{item}</Text>
          </View>
          
        })}
        <View style={{ width: windowWidth * 0.3, alignItems: 'center'  }}>
          <Button onPress={() => {
            AsyncStorage.setItem('choice', JSON.stringify(choices));
            setChooseFlag(true);
          }} title='Start'></Button>
        </View>
    </View>
  };

  const showAlert = () =>
    Alert.alert(
      'Alert Title',
      'My Alert Msg',
      [
        {
          text: 'Cancel',
          onPress: () => Alert.alert('Cancel Pressed'),
          style: 'cancel',
        },
      ],
      {
        cancelable: true,
        onDismiss: () =>
          Alert.alert(
            'This alert was dismissed by tapping outside of the alert dialog.',
          ),
      },
    );

  async function detectBlurPic(target: string) {
    // console.log(target);

    // try {
    //   let img = cv.imread(target);

    // } catch(e) {
    //   console.log(e);
    // }

    // return ;
    // if(!img){
      // showAlert();
      // return;
    // }

    // let score = processPic(img);

    // console.log('score', score);
  };

  const analyze = async () => {
    
    // detectBlurPic(pic);

    navigation.navigate('photo');
  };

  const retake = async () => {
    setPic(undefined);
    await AsyncStorage.clear();
  };

  if(setting){
    if (!permission) {
      // Camera permissions are still loading.
      return <View />;
    }

    if (!permission.granted) {
      // Camera permissions are not granted yet.
      return (
        <View style={styles.container}>
          <Text style={styles.message}>We need your permission to show the camera</Text>
          <Button onPress={requestPermission} title="grant permission" />
        </View>
      );
    }

    if(pic){
      // if took pic
      return <View style={{ height: '100%' }}>
        <Image
          style={{ width: '100%', height: '90%' }}
          source={{ uri: pic }}
          ref={picRef}
        />
        <View style={styles.buttons}>
          <TouchableOpacity style={ButtonStyle.button} onPress={analyze}>
            <Text style={styles.text}>Analyze</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ButtonStyle.button} onPress={retake}>
            <Text style={styles.text}>Retake</Text>
          </TouchableOpacity>
        </View>
      </View>
    }

    return (
      <View style={styles.container}>
        <CameraView style={styles.camera} ref={cameraRef} facing={facing}>
          <View style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={takePic} style={styles.takePic}>
              <TabBarIcon style={{fontSize: 50}} name='camera-sharp' />
            </TouchableOpacity>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={ButtonStyle.button} onPress={toggleCameraFacing}>
                <Text style={styles.text}>Flip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ButtonStyle.button} onPress={toggleCameraOpen}>
                <Text style={styles.text}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
      <ThemedView style={styles.container}>
          <ThemedView style={styles.headerView}>
            <ThemedText style={styles.titleName} type='title'>GIAO</ThemedText>
            <ThemedText style={styles.subtitle} type='subtitle'>Your Graphical Identification and Analysis Online</ThemedText>
          </ThemedView>
          {renderOptions()}
      </ThemedView>
      );
}

const styles = StyleSheet.create({
  btmButton: {
    margin: 16,
    
  },
  buttons: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  cameraBorder: {
    width: 350,
    height: 350,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 8
  },
  safeArea: {
    display: 'flex'
  },
  cameraBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerView: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    marginTop: 32,
    position: 'absolute',
    top: 0
  },
  titleName: {
    fontSize: 60,
    lineHeight: 60,
    textAlign: 'center',
    margin: 16
  },
  subtitle: {
    textAlign: 'center',
    margin: 16
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#A1CEDC',
    backgroundColor: '#D0D0D0',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
    position: 'static',
    alignItems: 'center',
    width: '100%'
  },
  buttonContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 24,
    width: '100%'
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
    margin: 16,
    borderRadius: 4,
    padding: 8
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  takePic: {
    borderWidth: 3,
    borderStyle: 'solid',
    borderRadius: 60,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
