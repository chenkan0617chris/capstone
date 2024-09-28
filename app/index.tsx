import { StyleSheet, Image, View, TouchableOpacity, Text, Button, Dimensions, Alert, Animated } from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { TabBarIcon } from '../components/navigation/TabBarIcon';
import { CHOICES, SCREEN_SCANNING } from '../constants/constants';
import { ButtonStyle } from '../constants/Colors';
import Checkbox from 'expo-checkbox';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const cropWidth = windowWidth * 0.6;
const cropHeight = windowHeight * 0.4;


export default function HomeScreen() {

  const [facing, setFacing] = useState<CameraType>('back');

  const [setting, setSetting] = useState<boolean>(false);
  const [pic, setPic] = useState<any>();
  const [choices, setChoices] = useState<string[]>(CHOICES);
  const [chooseFlag, setChooseFlag] = useState<boolean>(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>();
  const picRef = useRef<any>();

  const animationValue = useRef(new Animated.Value(0)).current;
  
  const navigation = useNavigation<any>();

  useEffect(() => {
    (async() => {
      const choiceStore = await AsyncStorage.getItem('choice');
      if(choiceStore){
        setChoices(JSON.parse(choiceStore));
      }

      await MediaLibrary.requestPermissionsAsync();
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

  const startAnimation = () => {
    Animated.loop(
      Animated.sequence([
          Animated.timing(animationValue, {
            toValue: cropHeight,
            duration: 2000,  
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0, 
            duration: 2000,
            useNativeDriver: true,
          }),
      ])
    ).start();
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

    const croppedImage = await cropImageToSquare(newPic);
    setPic(croppedImage.uri);

    try {
      await AsyncStorage.setItem('pic', croppedImage.uri);

      await MediaLibrary.createAssetAsync(croppedImage.uri);
    } catch (e) {
      console.log(e);
    }
  };

  const cropImageToSquare = async (photo: any) => {

    const widthMultiple = photo.width / windowWidth;
    const heightMultiple = photo.height / windowHeight;

    const xOffset = (photo.width - cropWidth * widthMultiple) / 2;
    const yOffset = (photo.height - cropHeight * heightMultiple) / 2;

    const cropped = await ImageManipulator.manipulateAsync(
      photo.uri,
      [
        {
          crop: {
            originX: xOffset,
            originY: yOffset,
            width: cropWidth * widthMultiple,
            height: cropHeight * heightMultiple,
          },
        },
      ],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );

    return cropped;
  };

  const renderOptions = () => {
    if(chooseFlag){
      return (
          <View style={styles.cameraBox}>
            <ThemedText>
              Your Choices: {JSON.stringify(choices)}
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

        <View style={{ width: windowWidth * 0.3, height: 80 }}>
          <TouchableOpacity 
            style={[ButtonStyle.button, {width: 100}]} 
            onPress={() => {
              AsyncStorage.setItem('choice', JSON.stringify(choices));
              setChooseFlag(true);
            }}
          >
            <Text style={styles.text}>Start</Text>
          </TouchableOpacity>
        </View>
    </View>
  };

  const analyze = async () => {
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
    startAnimation();

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
        <View style={styles.overlay}>
          <View style={styles.frame}>
            <Animated.View style={[styles.scannerLine, {  transform: [{ translateY: animationValue }] }]} />
          </View>
        </View>
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
    lineHeight: 70,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    margin: 16
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: cropWidth,
    height: cropHeight,
    borderWidth: 1,
    borderColor: '#9e9e9e',
    position: 'relative',
    overflow: 'hidden',
  },
  scannerLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'lime',
    position: 'absolute',
    top: 0,
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
