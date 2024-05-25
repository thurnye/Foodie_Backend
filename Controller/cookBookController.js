const mongoose = require('mongoose');
const Recipe = require('../Model/recipe');
const User = require('../Model/user');
const puppeteer = require('puppeteer');
const fs = require('fs');
const ejs = require('ejs');
const path = require('path');

async function renderHtml(data) {
    return new Promise((resolve, reject) => {
      const htmlContent = ejs.renderFile('Views/index.ejs', { data }, (err, renderedHtml) => {
        if (err) {
          reject(err);
        } else {
          const htmlFilePath = 'Views/index.html';
          fs.writeFile(htmlFilePath, renderedHtml, 'utf8', (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(htmlFilePath);
            }
          });
        }
      });
    });
  }
  
  async function convertToPdf(htmlFilePath) {
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      // const fileUrl = `file://${htmlFilePath}`;
      const fileUrl = `file://${path.resolve(htmlFilePath)}`;
      console.log(fileUrl)
      // const fileUrl = `file://${__dirname}/../views/index.html`;
      await page.goto(fileUrl, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf();
      await browser.close();
      return pdfBuffer;
      
    } catch (error) {
      console.log("CONVERSION ERROR:::", error)
    }
  }

const createRecipeBookPDF = async (req, res, next) => {
  try {
    console.log(req.body);
    const author = req.params.userId;
    const recipeIds = req.body.recipeIds;
    const recipes = await Recipe.find({
      _id: { $in: recipeIds },
      author: author,
    })
    .select('details basicInfo nutritionalFacts directions ')
    .exec();
    console.log(recipes.length);
    const dynamicData = {
        title: 'Dynamic Content Example',
        message: 'Hello, world!'
      };
      // Render the dynamic content to an HTML file
  const htmlFilePath = await renderHtml(dynamicData);

  // Convert HTML file to PDF using Puppeteer
  const pdfBuffer = await convertToPdf(htmlFilePath);

  // Send the PDF as response
  res.contentType("application/pdf");
  
  res.send(pdfBuffer);

    //   const pdfBuffer = await generatePDF(htmlContent);
    // Send the PDF buffer to the client
    //   res.send(pdfBuffer);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  createRecipeBookPDF,
  //   updateNewRecipe
};
