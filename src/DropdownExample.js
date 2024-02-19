import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { Modal ,Toast} from 'react-bootstrap';



const DropdownExample = () => {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [inheritFrom, setInheritFrom] = useState('');
  const [keyValuePairs, setKeyValuePairs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [inheritValues, setInheritValues] = useState([]);
  const [selectedProject, setSelectedProject] = useState('cs-v3-frontend');
  const [inheritLabel, setInheritLabel] = useState('ENV variable from');
  const [deploying, setDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(null);
  const [buildStatusLinkVisible, setBuildStatusLinkVisible] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState('');
  const [aborted, setAborted] = useState(false);
  const [buildNumber, setBuildNumber] = useState(null); 
  const [buildCheckInterval, setBuildCheckInterval] = useState(null);
  const [showBranchNamePopup, setShowBranchNamePopup] = useState(false); // Step 1
  const [showModal, setShowModal] = useState(false);

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);
  const [showBranchNameToast, setShowBranchNameToast] = useState(true);

  const toggleBranchNameToast = () => setShowBranchNameToast(!showBranchNameToast);

  const toggleBranchNamePopup = () => setShowBranchNamePopup(!showBranchNamePopup);



  const fetchBranches = async () => {
    try {
      const response = await fetch('http://10.40.29.23:3005/get-branches');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.branches) && data.branches.length > 0) {
          setBranches(data.branches);
        } else {
          console.error('Invalid branches format in API response:', data);
        }
      } else {
        throw new Error('Failed to fetch branches');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  //========================================================================================================

  const fetchInheritValues = async () => {
  try {
    const response = await fetch('http://10.40.29.23:3005/get-secrets');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.secretKeys) && data.secretKeys.length > 0) {
        setInheritValues(data.secretKeys);

        // Check if there exists a secret specific to the selected branch
        const branchSpecificSecret = `cs/v3/frontend/${selectedBranch}`;
        if (data.secretKeys.includes(branchSpecificSecret)) {
          setInheritFrom(branchSpecificSecret);
          deployApiForInherit(branchSpecificSecret);
          setInheritLabel('ENV variable');
        } else {
          // Secret doesn't exist, show all secrets
          setInheritFrom('');
          setInheritLabel('ENV variable from');
        }

        // Check the length of the selected branch name
        const selectedBranchLength = selectedBranch.length;
        if (selectedBranchLength > 12) {
          // Show pop-up message
          setShowBranchNamePopup(true);
        } else {
          // Hide pop-up message
          setShowBranchNamePopup(false);
        }
      } else {
        console.error('Invalid inheritValues format in API response:', data);
      }
    } else {
      throw new Error('Failed to fetch inherit values');
    }
  } catch (error) {
    console.error('Error fetching inherit values:', error);
  }
};

useEffect(() => {
  fetchBranches();
  fetchInheritValues();
}, [selectedBranch]);


  //==============================================================================================================

  const handleBranchChange = (event) => {
    setSelectedBranch(event.target.value);
  };
  const handleInheritFromChange = (event) => {
    setInheritFrom(event.target.value);
    deployApiForInherit(event.target.value);
  };

  const getStatusButtonStyle = () => {
    if (deploySuccess === true) {
      return 'success-button';
    } else if (deploySuccess === false) {
      return 'failure-button';
    } else {
      return 'deploy-button';
    }
  };

  //==================================================================
  //==================================================================
  //into array of objects [ { key : "Env", value : "prod"}...]
  //==================================================================
  function convertObjectToArray(obj) {
    return Object.keys(obj).map((key) => ({ key: key, value: obj[key] }));
  }

  function convertArrayToObject(arrayOfObjects) {
    const obj = {};
    arrayOfObjects.forEach((item) => {
      obj[item.key] = item.value;
    });
    return obj;
  }

  //==================================================================
  //==================================================================

  const deployApiForInherit = async (selectedInherit) => {
    try {
      const response = await fetch('http://10.40.29.23:3005/secrets-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secretName: selectedInherit,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.secrets) {
          const keyValues = convertObjectToArray(data.secrets);
          console.log('keyValues', keyValues);
          setKeyValuePairs(keyValues);
        } else {
          console.error('Invalid secrets data format in API response:', data);
        }
      } else {
        console.error('Failed to fetch data:', response.statusText);
        // Handle the error or throw it if you want to handle it elsewhere
      }
    } catch (error) {
      console.error('Error during fetch:', error);
      // Handle the error
    }
  };

  const addKeyValuePair = (key_name = '_new_key') => {
    setKeyValuePairs([...keyValuePairs, { key: `Key${keyValuePairs.length}`, value: '' }]);
    //========================================================
    //========================================================
  };
  const deleteKeyValuePair = (index) => {
    const updatedPairs = keyValuePairs.filter((_, i) => i !== index);
    setKeyValuePairs(updatedPairs);
  };

  const handleKeyChange = (key, value) => {
    console.log(key);
    setKeyValuePairs((prevArray) =>
      prevArray.map((obj) => (obj.key === key ? { ...obj, key: value } : obj))
    );
  };

  const handleValueChange = (key, value) => {
    setKeyValuePairs((prevArray) =>
      prevArray.map((obj) => (obj.key === key ? { ...obj, value: value } : obj))
    );
  };

  //=================================================================================================================================

  const checkBuildStatus = async () => {
    console.log('build number is', buildNumber);
    await new Promise(resolve => setTimeout(resolve, 10000));
    if (!deploying) {
      console.log('Deployment completed. Stopping build status check.');
      clearInterval(buildCheckInterval);
      return;
    }
    try {
      const requestBody = {
        buildNumber: buildNumber,
      };
      const jsonString = JSON.stringify(requestBody);
      console.log(jsonString);

      const response = await fetch('http://10.40.29.23:3005/get-build-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonString,
      });
        
      if (response.ok) {
        console.log('Response is OK');
        const data = await response.json();
        const { buildNumber } = data;
            setBuildNumber(buildNumber);
            console.log("in bcheck fun ",buildNumber);
        const buildStatus = data.buildStatus;
        switch (buildStatus) {
            case 'SUCCESS':
              console.log('Build successful!');
              clearInterval(buildCheckInterval);
              setDeploySuccess(true);
              setBuildStatusLinkVisible(true);
              fetchDeployedUrl();
              break;
    
            case 'FAILURE':
              console.error('Build failed!');
              clearInterval(buildCheckInterval);
              setDeploySuccess(false);
              setBuildStatusLinkVisible(true);
              break;
    
            case 'ABORTED':
              console.error('Build aborted!');
              clearInterval(buildCheckInterval);
              setAborted(true);
              setBuildStatusLinkVisible(true);
              break;
    
            default:
              console.error('Unknown build status:', buildStatus);
          }
          setBuildStatusLinkVisible(true);
        } else {
          console.error('Failed to check build status:', response.statusText);
        }
      } catch (error) {
        console.error('Error checking build status:', error);
      }
    };
  
//===================================

const fetchDeployedUrl = async (branch) => {
    console.log(setDeployedUrl);
  try {
    const response = await fetch('http://10.40.29.23:3005/get-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branch: selectedBranch,
      }),
    });

    if (response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object' && data['branch-url']) {
          setDeployedUrl(data['branch-url']);
          
      } else {
        console.error('Invalid URL format in API response:', data);
      }
    } else {
      throw new Error('Failed to fetch deployed URL');
    }
  } catch (error) {
    console.error('Error fetching deployed URL:', error);
  }
};
  //===================================================================================================================

  const deployApi = async () => {
    console.log(convertArrayToObject(keyValuePairs));
  
    try {
      const selectedBranchLength = selectedBranch.length;
      if (selectedBranchLength > 12) {
        // Show pop-up message
        setShowBranchNamePopup(true);}

        else {

   const payload = {
        branch: selectedBranch,
        secretName: `cs/v3/frontend/${selectedBranch}`,
        secretValue: convertArrayToObject(keyValuePairs),
      };

  
      const response = await fetch('http://10.40.29.23:3005/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        const responseData = await response.json();
        console.log('API deployed successfully:', payload);
  
        if (buildNumber === null) {
            const { buildNumber } = responseData;
            setBuildNumber(buildNumber);
            console.log('Build Number:', buildNumber);
          }
  
        setDeploying(true);
        // const intervalId = setInterval(checkBuildStatus, 10000);

        // setBuildCheckInterval(intervalId);
     checkBuildStatus(buildNumber);

        // Set interval to check build status every 10 seconds
        
      } else {
        console.error('Failed to deploy API:', response.statusText);
       } }
    } catch (error) {
      console.error('Error updating API:', error);
    }
  };
  useEffect(() => {
    fetchBranches();
    fetchInheritValues();
  }, []);

useEffect(() => {
    if (buildNumber !== null) {
      const intervalId = setInterval(() => {
        checkBuildStatus(buildNumber);
      }, 10000);
  
      // Save the interval ID for cleanup
      setBuildCheckInterval(intervalId);
  
      // Perform initial check
      checkBuildStatus(buildNumber);
  
      // Optionally, you may want to clear the interval on component unmount
      return () => clearInterval(intervalId);
    }
  }, [buildNumber]);

  const getStatusButtonVariant = () => {
    if (deploySuccess === true) {
      return 'success';
    } else if (deploySuccess === false) {
      return 'danger';
    } else {
      return 'primary';
    }
  };
  
     
//===================================

  return (
   
     
    
    
    <div className='bg-white text-black'>
       
    <Form>
      <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
        <Form.Label>Project:</Form.Label>
        <Form.Select
          aria-label="Default select example"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="cs-v3-frontend">cs-v3-frontend</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3" controlId="exampleForm.ControlInput2">
        <Form.Label>Select Branch:</Form.Label>
        <Form.Select
          aria-label="Default select example"
          value={selectedBranch}
          onChange={handleBranchChange}
        >
          <option value="" disabled hidden>
            Choose a branch
          </option>
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3" controlId="exampleForm.ControlInput3">
        <Form.Label>{inheritLabel}:</Form.Label>
        <Form.Select
          aria-label="Default select example"
          value={inheritFrom}
          onChange={handleInheritFromChange}
          disabled={!inheritValues.length}
        >
          <option value="" disabled hidden>
            Choose a value
          </option>
          {inheritFrom ? (
            <option key={inheritFrom} value={inheritFrom}>
              {inheritFrom}
            </option>
          ) : (
            inheritValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))
          )}
        </Form.Select>
      </Form.Group>
    </Form>

   
  
    {keyValuePairs.map((pair, index) => (
        <div key={index} className="key-value-pair" style={{ display: 'flex', marginBottom: '10px' }}>
          <Row>
            <Col xs={5}>
              <Form.Control
                type="text"
                placeholder={`Key ${index + 1}`}
                value={pair?.key}
                onChange={(e) => handleKeyChange(pair.key, e.target.value)}
              />
            </Col>
            <Col xs={5}>
              <Form.Control
                type="text"
                placeholder={`Value ${index + 1}`}
                value={pair?.value}
                onChange={(e) => handleValueChange(pair.key, e.target.value)}
              />
            </Col>
            <Col xs={2} className="d-flex align-items-center justify-content-end">
              <Button variant="danger" onClick={() => deleteKeyValuePair(index)}>
                Delete
              </Button>
            </Col>
          </Row>
        </div>
      ))}

   
  
<div className='bg-white text-black'>
      {/* ... (your existing code) */}
      <Row className="mb-3">
        <Col>
          <Button
            type="button"
            variant="outline-success"
            className="small-packed-btn"
            onClick={addKeyValuePair}
          >
            Add
          </Button>
        </Col>
      </Row>
    </div>


    <div className='d-flex justify-content-center'>
        {deploySuccess === true && (
          <Button variant='success' className='mr-2'>
            Build Successful
          </Button>
        )}
        {deploySuccess === false && (
          <Button variant='danger' className='mr-2'>
            Build Failed
          </Button>
        )}
        {deploySuccess === null && (
          <Button
            onClick={deployApi}
            variant='primary'
            className='mr-2'
            disabled={deploying}
          >
            {deploying ? 'Build Initiated' : 'DEPLOY'}
          </Button>
        )}
      </div>

      <div className='bg-white text-black'>
        {buildStatusLinkVisible && (
          <p>
          Click <a href={`https://opshop.stage.multisafe.finance/job/coinshift-frontend-v3/${buildNumber}/console`} target="_blank" rel="noopener noreferrer">here</a> for build logs( BuildNumber: {buildNumber}).
        </p>
        
        )}
      </div>
      <div className='bg-white text-black'>
  {/* Your existing code here */}
</div>

{/* Deployed URL section */}
{deployedUrl && deploySuccess === true && (
  <div className="deployed-url-section">
    <p>
      Deployed URL: <a href={deployedUrl} target="_blank" rel="noopener noreferrer">{deployedUrl}</a>
    </p>
  </div>
)}

{showBranchNamePopup && (
       <Toast show={showBranchNameToast} onClose={toggleBranchNameToast} bg="danger" text="white">
       <Toast.Header>
         <strong className="me-auto">Important Note</strong>
         <small>just now</small>
       </Toast.Header>
       <Toast.Body>
         Please note: Deployment is not possible if the branch name exceeds 12 characters.
         For assistance, kindly reach out to the DevOps team.
       </Toast.Body>
     </Toast>
      )}

      
    </div>
  );
};
  
export default DropdownExample;
