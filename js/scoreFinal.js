        (function () {
            console.log('=== DEBUG RESULTADO ===');
            console.log('quizAnswers:', sessionStorage.getItem('quizAnswers'));
            console.log('QuizScore:', window.QuizScore);
            var result = window.QuizScore.saveFinalResult();
            console.log('Resultado final:', result);
            var total = result.score;
            var max = result.maxScore;

            var percent = Math.max(
                0,
                Math.min(100, (total / max) * 100)
            );

            var scoreLabel = document.getElementById('score-current');

            if (scoreLabel) {
                scoreLabel.textContent = 'Tú (' + total + ')';
            }

            var fill = document.querySelector('.route-progress-fill');

            if (fill) {
                fill.style.width = percent + '%';
            }

            var dot = document.querySelector('.route-progress-dot');

            if (dot) {
                dot.style.left = percent + '%';
            }
        })();