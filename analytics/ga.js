import analytics from '@react-native-firebase/analytics';

let Analytics = {

    trackScreenView: async function(screen) {
        await analytics().setCurrentScreen(screen, screen);
    },


    logSearch: async function(searchTerm) {
        await analytics().logSearch({
            search_term: searchTerm,
        });
    },


    logViewItem: async function(itemNumber, desc) {
        await analytics().logViewItem({
            item_id: itemNumber.toString(),
            item_name: desc,
            item_category: desc
        });
    }
    
};

export default Analytics;