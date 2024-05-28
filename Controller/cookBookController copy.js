const mongoose = require('mongoose');
const Recipe = require('../Model/recipe');
const User = require('../Model/user');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const ejs = require('ejs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function renderHtml(data, pageType, bookTitle) {
  const htmlFilePath = path.join(__dirname, '../Views', `${pageType}.html`);
  const ejsFilePath = path.join(__dirname, '../Views/index.ejs');
  try {
    const renderedHtml = await ejs.renderFile(ejsFilePath, { data, type: pageType, bookTitle });
    await fs.writeFile(htmlFilePath, renderedHtml, 'utf8');
    return htmlFilePath;
  } catch (err) {
    throw new Error(`Error rendering HTML: ${err.message}`);
  }
}

async function convertToPdf(htmlFilePath) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const fileUrl = `file://${path.resolve(htmlFilePath)}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf();
    await browser.close();
    return pdfBuffer;
  } catch (error) {
    throw new Error(`Conversion to PDF failed: ${error.message}`);
  }
}

async function combinePdfBuffers(pdfBuffers) {
  const mergedPdf = await PDFDocument.create();
  for (const pdfBuffer of pdfBuffers) {
    const pdf = await PDFDocument.load(pdfBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  return await mergedPdf.save();
}

const createRecipeBookPDF = async (req, res, next) => {
  try {
    const { userId: author } = req.params;
    const { recipeIds, coverPage, name: bookName, description } = req.body;

    const recipes = await Recipe.find({
      _id: { $in: recipeIds },
      author: author,
    })
    .select('details basicInfo nutritionalFacts directions author')
    .populate({
      path: 'author',
      select: 'aboutMe firstName lastName avatar slogan',
    })
    .exec();

    const findAuthor = await User.findById(author)
    .select('aboutMe firstName lastName avatar slogan')
    .exec();

    const dynamicData = {
      recipe: recipes,
      author: findAuthor,
      frontCover: {
        firstName: findAuthor.firstName,
        lastName: findAuthor.lastName,
        bookTitle: bookName,
        image: coverPage,
        description: description
      }
    };

    // Render and convert each page to PDF
    const frontPagePath = await renderHtml(dynamicData.frontCover, 'frontPage', bookName);
    const frontPageBuffer = await convertToPdf(frontPagePath);

    const authorPagePath = await renderHtml(dynamicData.author, 'aboutPage', bookName);
    const authorPageBuffer = await convertToPdf(authorPagePath);

    const recipePageBuffers = await Promise.all(recipes.map(async (recipe) => {
      const recipePagePath = await renderHtml(recipe, 'recipePage', bookName);
      return await convertToPdf(recipePagePath);
    }));

    // Combine all PDF buffers into a single PDF
    const combinedPdfBuffer = await combinePdfBuffers([frontPageBuffer, authorPageBuffer, ...recipePageBuffers]);

    // Send the combined PDF as response
    res.contentType("application/pdf");
    res.send(combinedPdfBuffer);

    // Clean up HTML files
    await Promise.all([frontPagePath, authorPagePath, ...recipePageBuffers.map((_, index) => path.join(__dirname, '../Views', `recipePage${index}.html`))].map(async (filePath) => {
      try {
        await fs.unlink(filePath);
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    }));

  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).send('An error occurred while creating the recipe book PDF.');
    }
  }
};

module.exports = {
  createRecipeBookPDF,
};




// module.exports = {
//   createRecipeBookPDF,
//   // getDataForPDF
//   //   updateNewRecipe
// };

const getDataForPDF = async (req, res, next) => {
  try {
    console.log(req.body);
    const author = req.params.userId;
    const recipeIds = req.body.recipeIds;
    const coverPage = req.body.coverPage;
    const bookName = req.body.name;
    const description = req.body.description;
    const recipes = await Recipe.find({
      _id: { $in: recipeIds },
      author: author,
    })
    .select('details basicInfo nutritionalFacts directions author')
    .populate({
      path: 'author',
      select: 'aboutMe firstName lastName avatar slogan',
    })
    .exec();

    const findAuthor = await User.findById(author)
    .select('aboutMe firstName lastName avatar slogan')
    .exec();

    const dynamicData = {
        recipe: recipes,
        author: findAuthor,
        frontCover: {
          firstName: findAuthor.firstName,
          lastName: findAuthor.lastName,
          bookTitle: bookName,
          image: coverPage,
          description: description
        }
      };
      res.status(200).json(dynamicData);
  } catch (error) {
    console.log(error);
  }
};