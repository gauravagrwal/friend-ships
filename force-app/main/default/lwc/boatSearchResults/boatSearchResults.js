import { LightningElement, api, wire, track } from 'lwc';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { publish, MessageContext } from 'lightning/messageService';
import { refreshApex } from '@salesforce/apex';

import getBoats from '@salesforce/apex/BoatDataService.getBoats';
import updateBoatList from '@salesforce/apex/BoatDataService.updateBoatList';

import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';
import BOAT_NAME from '@salesforce/schema/Boat__c.Name';
import BOAT_TYPE from '@salesforce/schema/Boat__c.BoatType__c';
import BOAT_LENGTH from '@salesforce/schema/Boat__c.Length__c';
import BOAT_PICTURE from '@salesforce/schema/Boat__c.Picture__c';
import BOAT_PRICE from '@salesforce/schema/Boat__c.Price__c';

const BOAT_FIELDS = [BOAT_NAME, BOAT_TYPE, BOAT_LENGTH, BOAT_PICTURE, BOAT_PRICE];

const SUCCESS_TITLE = 'Success';
const SUCCESS_VARIANT = 'success';
const MESSAGE_SHIP_IT = 'Ship it!';
const ERROR_TITLE = 'Error';
const ERROR_VARIANT = 'error';

export default class BoatSearchResults extends LightningElement {
    selectedBoatId;
    columns = [
        { label: 'Name', fieldName: 'Name', type: 'text', editable: 'true' },
        { label: 'Length', fieldName: 'Length__c', type: 'number', editable: 'true' },
        { label: 'Price', fieldName: 'Price__c', type: 'currency', editable: 'true' },
        { label: 'Description', fieldName: 'Description__c', type: 'text', editable: 'true' },
    ];
    boatTypeId = '';
    boats;
    isLoading = false;

    @wire(MessageContext)
    messageContext;

    @wire(getBoats, { boatTypeId: '$boatTypeId' })
    wiredBoats(result) {
        this.boats = result;
        if (result.error) {
            this.boats = undefined;
            this.error = 'Unknown Error';
            if (Array.isArray(error.body)) {
                this.error = error.body.map(e => e.message).join(', ');
            } else if (typeof this.error.body.message == 'string') {
                this.error = error.body.message;
            }
        }
        this.isLoading = false;
        this.notifyLoading(this.isLoading);
    }

    // public function that updates the existing boatTypeId property
    // uses notifyLoading
    @api
    searchBoats(boatTypeId) {
        this.boatTypeId = boatTypeId;
        this.notifyLoading(true);
    }

    // this public function must refresh the boats asynchronously
    // uses notifyLoading
    @api async refresh() {
        this.notifyLoading(true);
        await refreshApex(this.boats);
        this.notifyLoading(false);
    }

    // this function must update selectedBoatId and call sendMessageService
    updateSelectedTile(event) {
        this.selectedBoatId = event.detail.boatId;
        this.sendMessageService(this.selectedBoatId);
    }

    // Publishes the selected boat Id on the BoatMC.
    sendMessageService(boatId) {
        // explicitly pass boatId to the parameter recordId
        publish(this.messageContext, BOATMC, { recordId: this.boatId });
    }

    // The handleSave method must save the changes in the Boat Editor
    // passing the updated fields from draftValues to the 
    // Apex method updateBoatList(Object data).
    // Show a toast message with the title
    // clear lightning-datatable draft values
    handleSave(event) {
        this.notifyLoading(true);
        const updatedFields = event.detail.draftValues;
        // Update the records via Apex
        updateBoatList({ data: updatedFields })
            .then(result => {
                const toast = new ShowToastEvent({
                    title: SUCCESS_TITLE,
                    message: MESSAGE_SHIP_IT,
                    variant: SUCCESS_VARIANT
                });
                this.dispatchEvent(toast);
                this.draftValues = [];

                return this.refresh();
            })
            .catch(error => {
                const toast = new ShowToastEvent({
                    title: ERROR_TITLE,
                    message: error.message,
                    variant: ERROR_VARIANT
                });
                this.dispatchEvent(toast);
            })
            .finally(() => { });
    }
    // Check the current value of isLoading before dispatching the doneloading or loading custom event
    notifyLoading(isLoading) {
        if (isLoading)
            this.dispatchEvent(new CustomEvent('loading'));
        else
            this.dispatchEvent(new CustomEvent('doneloading'));
    }
}
