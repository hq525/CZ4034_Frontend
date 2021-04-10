import React, { useState, useEffect } from 'react';
import './App.css';
import {
  TextField,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Snackbar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel
} from '@material-ui/core';
import Rating from '@material-ui/lab/Rating';
import Autocomplete from '@material-ui/lab/Autocomplete';
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core/styles';
import FilterListIcon from '@material-ui/icons/FilterList';
import API from "./utils/API"
import { ENDPOINT } from "./utils/config"
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';

const attractions = [
  "All",
  "ArtScience Museum at Marina Bay Sands",
  "Gardens by the Bay",
  "Jurong Bird Park",
  "National Orchid Garden",
  "Singapore Cable Car",
  "Flower Dome",
  "National Museum of Singapore",
  "Sands Skypark Observation Deck",
  "Singapore Botanic Gardens",
  "Asian Civilisations Museum",
  "Singapore Flyer",
  "Singapore Zoo",
  "Supertree Grove",
  "Cloud Forest",
  "Night Safari",
  "Jewel Changi Airport"
];

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  root: {
    width: '60vw',
    backgroundColor: theme.palette.background.paper,
  },
  inline: {
    display: 'inline',
  },
}));

function App() {
  const classes = useStyles();
  const [suggestions, setSuggestions] = useState([])
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [reviews, setReviews] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [start, setStart] = useState(0);
  const [maxRowIndex, setMaxRowIndex] = useState(0);
  
  const [sortCriteria, setSortCriteria] = useState("none");
  const [sortDirection, setSortDirection] = useState("desc");
  const [sentimentFilter, setSentimentFilter] = useState("All")
  const [attractionFilter, setAttractionFilter] = useState("All")
  const [usefulnessFilter, setUsefulnessFilter] = useState("All");

  const [errorBarOpen, setErrorBarOpen] = React.useState(false);
  const [errorText, setErrorText] = React.useState('');

  const [dialogOpen, setDialogOpen] = React.useState(false);

  useEffect(() => {
    if (autocompleteLoading) {
      setSuggestions([{term: 'Loading...'}]);
    }
  }, [autocompleteLoading]);

  const createSelectQuery = (baseQuery) => {
    if (sortCriteria !== "none") {
      baseQuery += `&sort=${sortCriteria} ${sortDirection}`
    }
    if (sentimentFilter !== "All") {
      baseQuery += `&fq=sentimentCategory:${sentimentFilter}`
    }
    if (attractionFilter !== "All") {
      baseQuery += `&fq=attractionName:"${attractionFilter}"`
    }
    if (usefulnessFilter !== "All") {
      baseQuery += `&fq=usefulness:${usefulnessFilter}`
    }
    return baseQuery
  }

  const handleChangeStart = (newStart) => {
    setLoading(true);
    let api = new API();
    api
    .get(createSelectQuery(`${ENDPOINT}/solr/reviews/select?q=${currentSearchTerm ? currentSearchTerm : '*:*'}&rows=${rowsPerPage}&start=${newStart}`))
    .then((data) => {
      setStart(newStart);
      setReviews(data.response.docs)
      setMaxRowIndex(data.response.numFound - 1)
      setLoading(false);
    })
    .catch((error) => {
      setError("Something went wrong")
      setLoading(false);
    })
  }

  const handleChangeRowsPerPage = (event) => {
    var previousRowsPerPage = rowsPerPage
    setRowsPerPage(event.target.value)
    setLoading(true);
    let api = new API();
    api
    .get(createSelectQuery(`${ENDPOINT}/solr/reviews/select?q=${currentSearchTerm ? currentSearchTerm : '*:*'}&rows=${event.target.value}&start=0`))
    .then((data) => {
      setStart(0);
      setReviews(data.response.docs)
      setMaxRowIndex(data.response.numFound - 1);
      setLoading(false);
    })
    .catch((error) => {
      setError("Something went wrong")
      setRowsPerPage(previousRowsPerPage);
      setLoading(false);
    })
  }

  const handleClose = () => {
    setDialogOpen(false);
    if (reviews.length > 0) {
      setLoading(true);
      let api = new API();
      api
      .get(createSelectQuery(`${ENDPOINT}/solr/reviews/select?q=${currentSearchTerm ? currentSearchTerm : '*:*'}&rows=${rowsPerPage}&start=0`))
      .then((data) => {
        setStart(0);
        setReviews(data.response.docs);
        setMaxRowIndex(data.response.numFound-1)
        setLoading(false);
      })
      .catch((error) => {
        setError("Something went wrong")
        setLoading(false);
      })
    }
  }

  const handleSearch = () => {
    setLoading(true);
    let api = new API();
    api
    .get(createSelectQuery(`${ENDPOINT}/solr/reviews/select?q=${searchTerm ? searchTerm : '*:*'}&rows=${rowsPerPage}&start=0`))
    .then((data) => {
      setStart(0);
      setCurrentSearchTerm(searchTerm);
      setReviews(data.response.docs);
      setMaxRowIndex(data.response.numFound-1)
      setLoading(false);
    })
    .catch((error) => {
      setError("Something went wrong")
      setLoading(false);
    })
  }

  const setError = (text) => {
    setErrorText(text);
    setErrorBarOpen(true);
  }

  const closeError = () => {
    setErrorBarOpen(false);
  }

  const handleSearchTermChange = (e, newValue) => {
    setSearchTerm(e.target.value);
    if (e.target.value === "") {
      setSuggestions([]);
    } else {
      setAutocompleteLoading(true);
      let api = new API();
      api
      .get(`${ENDPOINT}/solr/reviews/suggest?q=${e.target.value}&rows=10`)
      .then((data) => {
        setAutocompleteLoading(false);
        setSuggestions(data.suggest.mySuggester[`${e.target.value}`].suggestions)
      })
      .catch((error) => {
        setAutocompleteLoading(false);
        setSuggestions([]);
      })
    }
  }

  return (
    <div className="App">
      <div className="Body">
        <div style={{marginTop: "10px"}} />
        <div style={{display: "flex", justifyContent: "center", alignItems: "center", width: "60vw", border: "1px solid", padding: "10px", borderColor: 'black'}}>
          <Autocomplete
          style={{width: "100%"}}
          freeSolo
          open={open}
          onOpen={() => {
            setOpen(true);
          }}
          onClose={() => {
            setOpen(false);
          }}
          disableClearable
          value={searchTerm}
          onChange={(event, newValue) => {
            setSearchTerm(newValue);
          }}
          options={suggestions.map((suggestion) => suggestion.term)}
          loading={autocompleteLoading}
          renderInput={(params) => (
            <TextField
              style={{margin: "0px"}}
              {...params}
              label="Search"
              margin="normal"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchTermChange}
              InputProps={{ 
                ...params.InputProps, 
                type: 'search',
                endAdornment: (
                  <React.Fragment>
                    {autocompleteLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
            />
          )}
          />
          <IconButton onClick={handleSearch}>
            <SearchIcon />
          </IconButton>
        </div>
        <div style={{width: "60vw", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
          <h1>Reviews</h1>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <FormControl variant="outlined" className={classes.formControl}>
              <InputLabel>Rows</InputLabel>
              <Select
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
                label="Rows"
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={() => {setDialogOpen(true)}}>
              <FilterListIcon />
            </IconButton>
          </div>
        </div>
        {
          (loading) ? (
            <div style={{width: "100%", height: "auto", display: "flex", justifyContent: "center", alignItems: "center"}}>
                <CircularProgress size={50} />
            </div>
          ) : (
            <List className={classes.root}>
              {
                reviews.map((review) =>
                  <ListItem key={review.id} button alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar src={review.reviewerProfilePicURL} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <React.Fragment>
                          <div style={{display: 'flex', justifyContent: 'flex-start', alignItems: 'center'}}>
                            <Typography
                              component="span"
                              variant="body1"
                              className={classes.inline}
                              color="textPrimary"
                            >
                              <b>{review.reviewTitle}</b>
                            </Typography>
                            <Rating value={review.ratings / 10} readOnly />
                          </div>
                        </React.Fragment>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            className={classes.inline}
                            color="textPrimary"
                          >
                            Reviewed by {review.reviewerName} on {new Date(review.reviewDate).toLocaleDateString()}
                          </Typography>
                          <div />
                          {review.reviewText}
                          <div style={{marginTop: "5px"}} />
                          <Link href={review.reviewURL}>
                            {review.reviewURL}
                          </Link>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                )
              }
            </List>   
          )
        }
        {
          !(loading) && (
            <Divider variant="middle" />
          )
        }
        {
          !(loading) && (reviews.length > 0) && (
            <div>
              <h5>Displaying {start+1} to {start+rowsPerPage > maxRowIndex ? maxRowIndex+1 : start+rowsPerPage} of {maxRowIndex+1} reviews.</h5>
              <div>
                <IconButton onClick={() => {handleChangeStart(start-rowsPerPage)}} disabled={start === 0 ? true : false} >
                  <ArrowBackIosIcon />
                </IconButton>
                <IconButton onClick={() => {handleChangeStart(start+rowsPerPage)}} disabled={start+rowsPerPage > maxRowIndex ? true : false}>
                  <ArrowForwardIosIcon />
                </IconButton>
              </div>
            </div>
          )
        }
      </div>
      <div style={{marginTop: "10px"}}/>
      <Snackbar 
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      open={errorBarOpen}
      autoHideDuration={6000}
      onClose={closeError}
      message={errorText}
      action={
        <React.Fragment>
          <IconButton size="small" aria-label="close" color="inherit" onClick={closeError}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </React.Fragment>
      }
      />
      <Dialog onClose={handleClose} open={dialogOpen}>
        <DialogTitle><b>Sort</b></DialogTitle>
        <DialogContent dividers>
          <FormControl variant="outlined" className={classes.formControl}>
            <InputLabel>Criteria</InputLabel>
            <Select
              value={sortCriteria}
              onChange={(event) => {setSortCriteria(event.target.value)}}
              label="Criteria"
            >
              <MenuItem value={"none"}>None</MenuItem>
              <MenuItem value={"ratings"}>Ratings</MenuItem>
              <MenuItem value={"compoundScore"}>Sentiment</MenuItem>
              <MenuItem value={"usefulness_score"}>Usefulness</MenuItem>
            </Select>
          </FormControl>
          <div />
          <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend">Direction</FormLabel>
            <RadioGroup value={sortDirection} onChange={(event) => {setSortDirection(event.target.value)}}>
              <FormControlLabel value="desc" control={<Radio />} label="Descending" />
              <FormControlLabel value="asc" control={<Radio />} label="Ascending" />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogTitle><b>Filter</b></DialogTitle>
        <DialogContent dividers>
          <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend">Sentiment</FormLabel>
            <RadioGroup value={sentimentFilter} onChange={(event) => {setSentimentFilter(event.target.value)}}>
              <FormControlLabel value="All" control={<Radio />} label="All" />
              <FormControlLabel value="Positive" control={<Radio />} label="Postive" />
              <FormControlLabel value="Negative" control={<Radio />} label="Negative" />
            </RadioGroup>
          </FormControl>
          <div />
          <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend">Usefulness</FormLabel>
            <RadioGroup value={usefulnessFilter} onChange={(event) => {setUsefulnessFilter(event.target.value)}}>
              <FormControlLabel value="All" control={<Radio />} label="All" />
              <FormControlLabel value="useful" control={<Radio />} label="Useful" />
              <FormControlLabel value="useless" control={<Radio />} label="Not Useful" />
            </RadioGroup>
          </FormControl>
          <div />
          <FormControl variant="outlined" className={classes.formControl}>
            <InputLabel>Attraction</InputLabel>
              <Select
                value={attractionFilter}
                onChange={(event) => {setAttractionFilter(event.target.value)}}
                label="Attraction"
              >
                {
                  attractions.map((attraction) => 
                    <MenuItem value={`${attraction}`}>{attraction}</MenuItem>
                  )
                }
              </Select>
          </FormControl>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
