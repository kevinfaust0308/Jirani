App = {

    web3Provider: null,
    contracts: {},

    init: () => {
        console.log("App.init()");
        return App.initWeb3();
    },

    initWeb3: () => {
        if (typeof web3 !== 'undefined') { // check if injected web3 provider such as metamask
            App.web3Provider = web3.currentProvider;
            console.log("found existing web3 provider");
        } else {
            App.web3Provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
            console.log("connecting to local Ganache");
        }
        web3 = new Web3(App.web3Provider);
        console.log("initialized web3 instance");
        return App.initContract();
    },

    initContract: () => {

        $.getJSON("LoanRequestPlatform.json", (data) => {
            // This creates an instance of the contract we can interact with.
            App.contracts.loanRequestPlatform = TruffleContract(data);
            // Set the provider for our contract
            App.contracts.loanRequestPlatform.setProvider(App.web3Provider);
            console.log("initialized loan request platform contract");

            return App.initUI();
        });
    },


    initUI: async () => {
        console.log("App.initUI()");

        const loanRequestPlatformInstance = await App.contracts.loanRequestPlatform.deployed();

        const acct = (await web3.eth.getAccounts())[0];
        $("#account").text(acct);

        const yourLoanRequests = await loanRequestPlatformInstance.getYourLoanRequestContracts();
        console.log("You have " + yourLoanRequests.length + " loan requests");

        // number of rows and columns to display
        const max_per_row = 2;
        const fullrows = Math.floor(yourLoanRequests.length / max_per_row);
        const excesscols = yourLoanRequests.length % max_per_row;

        const loanDisplay = $("#loanDisplay");
        let currRow = null;

        for (let i = 0; i < yourLoanRequests.length; i++) {
            const lr = yourLoanRequests[i];
            const res = await loanRequestPlatformInstance.extractLoanRequestContractData(lr);

            console.log(res);

            // unpack and convert values to appropriate format
            const amountReq = res[1].toString();
            const amountAcc = res[2].toString();
            const numLoaners = res[5].toNumber();

            // unpack and rename to the following new variable names
            // dont care about requestee since requestee is YOU
            const {3: reason, 4: repaymentPlan} = res;

            console.log("Request %s/%s because of %s. Backed by %d", amountAcc, amountReq, reason, numLoaners);

            // update UI
            // start of new row
            if (i % max_per_row === 0) {

                const temp = $('<div>', {
                    id: "row-" + i,
                    class: "card-group"
                });
                loanDisplay.append(temp);
                currRow = temp;
            }

            // dynamic progress bar setup
            const prog = parseFloat(amountAcc) / parseFloat(amountReq);


            const newCard = `<div class="card">
                <div class="card-body">
                    <h4>Reason for loan</h4>
                    <p class="reason">${reason}</p>
                
                    <h4>Repayment plan</h4>
                    <p class="repaymentplan">${repaymentPlan}</p>
                
                    <h4>Progress</h4>
                    <div class="progress">
                        <div id="progressbar" class="progress-bar bg-success" role="progressbar" style="width: ${prog}%;"
                             aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                             ${prog.toFixed(2) + '%'}
                        </div>
                    </div>
                
                    <small class="text-muted">${amountAcc} out of ${amountReq} WEI raised</small>
                    
                </div>
                

                <button id="repay-btn-${i}" type="button" class="btn btn-primary repay-btn" data-contract-num=${i} onClick="App.repay(${i})">Repay</button>
  
                
            </div>`;
            currRow.append(newCard);

            // disable button if not fully paid back yet
            if (amountAcc !== amountReq) {
                $(`#repay-btn-${i}`).prop('disabled', true);
            }

            // completed a row
            if (i % max_per_row === max_per_row - 1) {
                loanDisplay.append("</div>");
            }

        }

        if (excesscols !== 0) {
            loanDisplay.append("</div>");
        }


        return App.bindEvents();
    },


    bindEvents: () => {
        // on button click, grab which loan request was selected if there are multiple being displayed
        // $('#repay').click(e => {
        //     App.repay($(this).attr("data-contract-num"));
        // })

    },

    repay: async (contractNum) => {

        const acct = (await web3.eth.getAccounts())[0];
        console.log(acct);

        const loanRequestPlatformInstance = await App.contracts.loanRequestPlatform.deployed();
        const yourLoanRequests = await loanRequestPlatformInstance.getYourLoanRequestContracts.call();

        // repay the desired loan
        try {
            const gas = await loanRequestPlatformInstance.repayLoan.estimateGas(yourLoanRequests[contractNum], {from: acct});
            let tx = await loanRequestPlatformInstance.repayLoan(yourLoanRequests[contractNum], {from: acct, gas: gas});
            console.log(tx);
            console.log("loan has been paid off");
        } catch (e) {
            console.log(e);
        }

    }

};

$(window).on("load", function () {

    App.init();

});

