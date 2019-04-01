/*
Toggles screen loading-display state
 */

function toggleFormSubmit(isLoading) {

    if (isLoading) {
        $("#spinner").css('visibility', 'visible');
        $("#overlay").css('visibility', 'visible');
        // button with loading spinner
        $("#submit").html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Loading...');
    } else {
        $("#spinner").css('visibility', 'hidden');
        $("#overlay").css('visibility', 'hidden');
        $("#submit").html('Submit');
    }

}