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

document.addEventListener('DOMContentLoaded', function() {
    getSelectedText(function(selectedText) {
        var readability = calculateReadability(selectedText);

        document.getElementById("output").innerHTML = "<div>Your score is " + readability.score + "</div>" +
            "<div>Your words is " + readability.words + "</div>" +
            "<div>Your sentences is " + readability.sentences + "</div>" +
            "<div>Syllables per word is " + readability.syllables / readability.words + "</div>";
    });
});