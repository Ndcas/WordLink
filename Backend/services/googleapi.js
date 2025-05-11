const apiKey = process.env.API_KEY;

function normalizeIPA(ipa) {
    result = ipa.replaceAll('/', '');
    result = result.replaceAll('(', '');
    result = result.replaceAll(')', '');
    result = result.replaceAll('ɬ', 'l');
    result = result.replaceAll('əː', 'ɜː');
    result = result.replaceAll('ɛː', 'eə');
    result = result.replaceAll('ã', 'aŋ');
    result = result.replaceAll('ɒ̃', 'ɒn');
    result = result.replaceAll('ᵻ', 'ɪ');
    result = result.replaceAll('ᵿ', 'ʊ');
    result = result.replaceAll('x', 'k');
    result = result.replaceAll('ẽ', 'eŋ');
    result = result.replaceAll('ĩ', 'iŋ');
    result = result.replaceAll('õ', 'oŋ');
    result = result.replaceAll('ũ', 'uŋ');
    result = result.replaceAll('ɚ', 'ər');
    return result;
}

async function explainPronunciation(ipa, word) {
    let url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    let headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
    }
    let body = {
        contents: [{
            parts: [{
                text: `Hãy giải thích ngắn gọn cách phát âm ${ipa} của từ ${word} trong tiếng Anh`
            }]
        }]
    }
    try {
        result = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        if (!result.ok) {
            throw new Error('Gemini API trả về lỗi', result.statusText);
        }
        result = (await result.json()).candidates[0].content.parts[0].text;
        return result;
    } catch (error) {
        throw new Error('Không thể kết nối Gemini API', error);
    }
}

async function pronounceWord(ipa, word) {
    ipa = normalizeIPA(ipa);
    let url = 'https://texttospeech.googleapis.com/v1/text:synthesize';
    let headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
    }
    let body = {
        input: {
            ssml: `<speak><phoneme alphabet="ipa" ph="${ipa}">${word}</phoneme></speak>`
        },
        voice: {
            languageCode: 'en-GB',
            name: 'en-GB-Standard-A',
            ssmlGender: 'FEMALE'
        },
        audioConfig: {
            audioEncoding: 'MP3'
        }
    }
    try {
        result = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        if (!result.ok) {
            throw new Error('TTS API trả về lỗi', result.statusText);
        }
        result = (await result.json()).audioContent;
        return result;
    } catch (error) {
        throw new Error('Không thể kết nối TTS API', error);
    }
}

module.exports = { explainPronunciation, pronounceWord };