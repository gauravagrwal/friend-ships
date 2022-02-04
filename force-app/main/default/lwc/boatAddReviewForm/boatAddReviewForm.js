import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import BOAT_REVIEW_OBJECT from '@salesforce/schema/BoatReview__c';
import NAME_FIELD from '@salesforce/schema/BoatReview__c.Name';
import COMMENT_FIELD from '@salesforce/schema/BoatReview__c.Comment__c';

const SUCCESS_TITLE = 'Review Created!';
const SUCCESS_VARIANT = 'success';
export default class BoatAddReviewForm extends LightningElement {
    // Private
    boatId;
    rating;
    boatReviewObject = BOAT_REVIEW_OBJECT;
    nameField = NAME_FIELD;
    commentField = COMMENT_FIELD;
    labelSubject = 'Review Subject';
    labelRating = 'Rating';

    @api
    get recordId() {
        return this.boatId;
    }

    set recordId(value) {
        this.setAttribute('boatId', value);
        this.boatId = value;
    }

    // Gets user rating input from stars component
    handleRatingChanged(event) {
        this.rating = event.detail.rating;
    }

    handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;
        fields.Rating__c = this.rating;
        fields.Boat__c = this.boatId;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    // Shows a toast message once form is submitted successfully
    // Dispatches event when a review is created
    handleSuccess(event) {
        const reviewId = event.detail.id;

        const toast = new ShowToastEvent({
            title: SUCCESS_TITLE,
            message: 'Review created successfully',
            variant: SUCCESS_VARIANT
        });
        this.dispatchEvent(toast);

        const createReviewEvent = new CustomEvent('createreview', { detail: reviewId });
        this.dispatchEvent(createReviewEvent);

        this.handleReset();
    }

    // Clears form data upon submission
    // TODO: it must reset each lightning-input-field
    handleReset() {
        this.rating = 0;
        const inputFields = this.template.querySelectorAll('lightning-input-field');
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
    }
}
