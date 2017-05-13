/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
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

    return {
        score: (FK_ONE - FK_TWO * (wordCount / sentenceCount)) - (FK_THREE * (syllableCount / wordCount)),
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

        word = word.toLowerCase();
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');

        syllables = word.match(/[aeiouy]{1,2}/g)

        if (syllables !== null) {
            syllableCount += syllables.length;
        }
    }

    return syllableCount;
}

function convertScoreToGrade(score) {
    if (score <= 30) { return 'College Graduate | Very Difficult' }
    if (score > 30 && score <= 50) { return 'College | Difficult' }
    if (score > 50 && score <= 60) { return '10th-12th Grade | Fairly Difficult' }
    if (score > 60 && score <= 70) { return '8th-9th Grade | Plain English' }
    if (score > 70 && score <= 80) { return '7th Grade | Fairly Easy' }
    if (score > 80 && score <= 90) { return '6th Grade | Easy' }
    if (score > 90) { return '5th Grade | Very Easy' }
}

document.addEventListener('DOMContentLoaded', function() {
    getSelectedText(function(selectedText) {
        var readability = calculateReadability(selectedText);

        document.getElementById("output").innerHTML = "<div>Your score is " + readability.score.toFixed(2) + "</div>" +
            "<div>Reading Level: " + convertScoreToGrade(readability.score) + " </div>" +
            "<div>Word count: " + readability.words.toFixed(2) + "</div>" +
            "<div>Sentence count: " + readability.sentences.toFixed(2) + "</div>" +
            "<div>Syllables per word: " + (readability.syllables / readability.words).toFixed(2) + "</div>";
    });
});