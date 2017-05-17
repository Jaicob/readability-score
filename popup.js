/**
 * Get the currently selected text on the active tab.
 *
 * @param {function(string)} callback - called when the selected text of the current tab
 *   is retreived.
 */
function getSelectedText(callback) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
        var tab = tabs[0];

        chrome.tabs.executeScript({
            code: "window.getSelection().toString();"
        }, function(selection) {
            callback(selection[0])
        });
    });
}

/**
 * Readability Score
 *
 * @params {String} text - the text in which to apply the reability formula
 *
 * This functin implements the Flesch-Kincaid formula, commonly used to calculate
 * the readability of text. The results are a reading-ease, and a reading-grade score.
 * Higher score mean easier to read, and lower scores mean harder to read
 */
function calculateReadability(text) {
    const FK_ONE = 206.835;
    const FK_TWO = 1.015;
    const FK_THREE = 84.600;

    let words = text.split(" ");
    let wordCount = words.length;
    let sentenceCount = calculateSentenceCount(text);
    let syllableCount = calculateSyllableCount(words);
    let score = (FK_ONE - FK_TWO * (wordCount / sentenceCount)) - (FK_THREE * (syllableCount / wordCount));

    if (sentenceCount < 1) {
        return {
            error: 'A full sentence needs to be selected.'
        };
    }

    return {
        score: score,
        words: wordCount,
        sentences: sentenceCount,
        syllables: syllableCount
    };
}

function calculateSentenceCount(text) {
    const sentenceRegex = /[^\.!\?]+[\.!\?]+/g;

    var totalSentences = 0,
        sentences = text.match(sentenceRegex);

    if (sentences !== null) {
        totalSentences += sentences.length;
    }

    return totalSentences;
}

function calculateSyllableCount(words) {
    var syllableCount = 0,
        word = undefined,
        syllables = null;

    for (var i = 0; i < words.length; i++) {
        word = words[i];

        if (word.length <= 3) {
            syllableCount += 1;
            continue;
        }

        syllables = word.toLowerCase()
            .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
            .replace(/^y/, '')
            .match(/[aeiouy]{1,2}/g);

        if (syllables !== null) {
            syllableCount += syllables.length;
        }
    }

    return syllableCount;
}

function convertScoreToGrade(score) {
    if (score <= 30) { return 'College Grad | Very Difficult' }
    if (score > 30 && score <= 50) { return 'College | Difficult' }
    if (score > 50 && score <= 60) { return '10th-12th Grade | Fairly Difficult' }
    if (score > 60 && score <= 70) { return '8th-9th Grade | Plain English' }
    if (score > 70 && score <= 80) { return '7th Grade | Fairly Easy' }
    if (score > 80 && score <= 90) { return '6th Grade | Easy' }
    if (score > 90) { return '5th Grade | Very Easy' }
}

function getIndicatorPosition(score) {
    var position = Math.floor(score);
    if (position <= 0) { position = 0 }
    if (position > 90) { position = 91 }

    return position;
}

document.addEventListener('DOMContentLoaded', function() {
    getSelectedText(function(selectedText) {
        var readability = calculateReadability(selectedText);

        if (readability.error) {
            document.getElementById("error-message").innerHTML = 'No Result: ' + readability.error;
            return;
        }

        var score = readability.score.toFixed(2),
            gradeLevel = convertScoreToGrade(readability.score),
            wordsPerSentence = (readability.words/readability.sentences).toFixed(2),
            syllablesPerWord = (readability.syllables / readability.words).toFixed(2);

        document.getElementById("meter-indicator").style.left = getIndicatorPosition(score) + '%';
        document.getElementById("primary-result-content").innerHTML = gradeLevel;
        document.getElementById("secondary-result-content-0").innerHTML = score;
        document.getElementById("secondary-result-content-1").innerHTML = wordsPerSentence;
        document.getElementById("secondary-result-content-2").innerHTML = syllablesPerWord;
    });
});