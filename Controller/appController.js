const AutoComplete = require('../Model/autoComplete');
const User = require('../Model/user');
const Event = require('../Model/events');
const Recipe = require('../Model/recipe');

//getAutoComplete
const getAutoComplete = async (req, res, next) => {
  try {
    const section = req.body.section;
    const query = {}
  if(section !== 'all' || !section || section !== ""){
    query['section'] = {$in : [...section]}
  }

  const result = await AutoComplete.find(query)
      .select('_id title section')
      .exec();
    const data = {
      autoComplete : result,
    };
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }
}

module.exports = {
  getAutoComplete,
};
