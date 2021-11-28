import * as React from 'react';
import {Button, StyleSheet} from 'react-native';

import EditScreenInfo from '../components/EditScreenInfo';
import {Text, View} from '../components/Themed';

type MyProps = {
};
type MyState = {
    recordSecs: number,
    recordTime: string,
};

export default class TabOneScreen extends React.Component<MyProps, MyState> {
    constructor(props: MyProps) {
        super(props);
        this.state = {
            recordSecs: 0,
            recordTime: '00:00:00',
        };
    }

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Audio Aufnahme</Text>
                <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)"/>
                <Button title={"Aufnahme starten"} onPress={() => this.action()}/>
                <EditScreenInfo path="/screens/TabOneScreen.tsx"/>
            </View>
        );
    }

    async action() {
        this.setState({recordSecs: 2})
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
