import * as React from 'react';
import {Button, Platform, StyleSheet} from 'react-native';

import EditScreenInfo from '../components/EditScreenInfo';
import {Text, View} from '../components/Themed';
import AudioRecorderPlayer, {
    AudioEncoderAndroidType,
    AudioSourceAndroidType,
    AVEncoderAudioQualityIOSType,
    AVEncodingOption
} from "react-native-audio-recorder-player";

type MyProps = {
    // using `interface` is also ok
    message: string;
};
type MyState = {
    recordSecs: number,
    recordTime: string,
    currentPositionSec: number,
    currentDurationSec: number,
    playTime: string,
    duration: string,
};

export default class TabOneScreen extends React.Component<MyProps, MyState> {
    private audioRecorderPlayer: AudioRecorderPlayer;

    constructor(props: MyProps) {
        super(props);
        this.audioRecorderPlayer = new AudioRecorderPlayer();
        if (Platform.OS !== 'web') this.audioRecorderPlayer.setSubscriptionDuration(0.09);
        this.state = {
            recordSecs: 0,
            recordTime: '00:00:00',
            currentPositionSec: 0,
            currentDurationSec: 0,
            playTime: '00:00:00',
            duration: '00:00:00',
        };
    }

    async record() {
        const path = 'hello.m4a';
        const audioSet = {
            AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
            AudioSourceAndroid: AudioSourceAndroidType.MIC,
            AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
            AVNumberOfChannelsKeyIOS: 2,
            AVFormatIDKeyIOS: AVEncodingOption.aac,
        };
        console.log('audioSet', audioSet);
        const uri = await this.audioRecorderPlayer.startRecorder(path, audioSet);
        this.audioRecorderPlayer.addRecordBackListener((e) => {
            this.setState({
                recordSecs: e.currentPosition,
                recordTime: this.audioRecorderPlayer.mmssss(
                    Math.floor(e.currentPosition),
                ),
            });
        });
        console.log(`uri: ${uri}`);
    }

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Audio Aufnahme</Text>
                <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)"/>
                <Button title={"Aufnahme starten"} onPress={() => this.record()}/>
                <EditScreenInfo path="/screens/TabOneScreen.tsx"/>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    separator: {
        marginVertical: 30,
        height: 1,
        width: '80%',
    },
});
