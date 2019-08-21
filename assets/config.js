requirejs.config({
    baseUrl: 'assets/modules',
    waitSeconds: 0,
    bundles: {
        fabric: ['fabric'],
        MediaStreamRecorder: ['MediaStreamRecorder'],
        randexp: ['randexp'],
        webcam:['Webcam'],
        sortable : ['Sortable'],
        handsontable: ["Handsontable"],
        pako : ['pako'],
        encoder : ['TextDecoder'],
        fingerprint : ['Fingerprint2'],
        winwheel : ['Winwheel']
    }
});
